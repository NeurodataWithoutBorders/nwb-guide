"""ConversionAgent wrapping ClaudeSDKClient for multi-turn NWB conversion conversations.

Each session is a long-running ClaudeSDKClient that maintains conversation context
across multiple user messages. Responses are streamed to a queue consumed by the
SSE endpoint.
"""

import asyncio
import logging
import queue
import threading
import uuid

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    HookContext,
    HookMatcher,
    ResultMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
)

from .api_config import APIConfig, DEFAULT_MODEL
from .monitoring import Monitor
from .session_store import append_message, create_session_record
from .skill_loader import load_skill

logger = logging.getLogger(__name__)


class ConversionAgent:
    """Wraps ClaudeSDKClient for a single conversion session.

    The agent runs in a background thread with its own event loop.
    Messages are put on a thread-safe queue and consumed by the SSE endpoint.
    """

    def __init__(self, session_id, data_dir, repo_dir, api_config=None, lab_name=None):
        self.session_id = session_id
        self.data_dir = data_dir
        self.repo_dir = repo_dir
        self.api_config = api_config or APIConfig()
        self.lab_name = lab_name

        # Thread-safe queue for SSE consumption
        self.message_queue = queue.Queue()

        # Monitor for transcript uploads
        self.monitor = Monitor(session_id, lab_name=lab_name)

        # Load the NWB conversion skill as the system prompt
        self.skill_prompt = load_skill()

        # Agent lifecycle
        self._client = None
        self._loop = None
        self._thread = None
        self._connected = False

    def start(self):
        """Start the agent in a background thread."""
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def _run_loop(self):
        """Run the asyncio event loop for the agent.

        The loop must stay running after connect() so that coroutines
        submitted via run_coroutine_threadsafe() can execute.
        """
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._connect())
            # Keep the event loop alive so send_message() coroutines can run
            self._loop.run_forever()
        except Exception as e:
            logger.error(f"Agent loop error: {e}", exc_info=True)
            self.message_queue.put({
                "type": "error",
                "content": f"Agent initialization failed: {str(e)}",
            })

    async def _connect(self):
        """Connect the ClaudeSDKClient."""
        env = self.api_config.to_env()

        options = ClaudeAgentOptions(
            system_prompt=self.skill_prompt,
            allowed_tools=["Bash", "Read", "Write", "Edit", "Glob", "Grep"],
            permission_mode="bypassPermissions",
            cwd=self.repo_dir,
            add_dirs=[self.data_dir],
            env=env,
            model=self.api_config.model or DEFAULT_MODEL,
            include_partial_messages=True,
            hooks={
                "PostToolUse": [
                    HookMatcher(hooks=[self._on_post_tool_use]),
                ],
                "Stop": [
                    HookMatcher(hooks=[self._on_stop]),
                ],
            },
        )

        self._client = ClaudeSDKClient(options=options)
        await self._client.connect()
        self._connected = True
        logger.info(f"Agent {self.session_id} connected")

    async def _on_post_tool_use(self, input_data, tool_use_id, context):
        """Hook: capture tool results for monitoring."""
        self.monitor.upload_chunk({
            "type": "tool_result",
            "tool_name": input_data.get("tool_name"),
            "tool_input": input_data.get("tool_input"),
        })
        return {}

    async def _on_stop(self, input_data, tool_use_id, context):
        """Hook: agent finished a turn."""
        return {}

    def interrupt(self):
        """Interrupt the agent's current turn."""
        if not self._connected or not self._loop or not self._client:
            return
        asyncio.run_coroutine_threadsafe(self._client.interrupt(), self._loop)

    def send_message(self, content):
        """Send a user message and stream responses to the queue.

        This is called from the Flask request thread. It submits work
        to the agent's event loop.
        """
        if not self._connected or not self._loop:
            self.message_queue.put({
                "type": "error",
                "content": "Agent not connected yet. Please wait.",
            })
            return

        # Upload user message to monitoring and persist
        self.monitor.upload_chunk({
            "type": "user_message",
            "content": content,
        })
        append_message(self.session_id, "user", content)

        # Schedule the async work on the agent's event loop
        future = asyncio.run_coroutine_threadsafe(
            self._process_message(content), self._loop
        )
        # Don't block — the SSE stream will pick up messages from the queue

    async def _process_message(self, content):
        """Send message to Claude and stream responses to the queue."""
        try:
            await self._client.query(content)

            async for message in self._client.receive_response():
                event = self._message_to_event(message)
                if event:
                    self.message_queue.put(event)
                    self.monitor.upload_chunk(event)
                    if event.get("type") == "assistant":
                        append_message(self.session_id, "assistant", event["content"])

        except Exception as e:
            logger.error(f"Agent message error: {e}", exc_info=True)
            self.message_queue.put({
                "type": "error",
                "content": str(e),
            })

    def _message_to_event(self, message):
        """Convert a Claude SDK message to a serializable event dict."""
        if isinstance(message, AssistantMessage):
            blocks = []
            for block in message.content:
                if isinstance(block, TextBlock):
                    blocks.append({"type": "text", "text": block.text})
                elif isinstance(block, ToolUseBlock):
                    blocks.append({
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    })
                elif isinstance(block, ToolResultBlock):
                    blocks.append({
                        "type": "tool_result",
                        "tool_use_id": block.tool_use_id,
                        "content": block.content if isinstance(block.content, str) else str(block.content),
                        "is_error": block.is_error,
                    })
            return {"type": "assistant", "content": blocks}

        elif isinstance(message, UserMessage):
            # Tool results come as UserMessage with ToolResultBlock content
            blocks = []
            for block in message.content:
                if isinstance(block, ToolResultBlock):
                    blocks.append({
                        "type": "tool_result",
                        "tool_use_id": block.tool_use_id,
                        "content": block.content if isinstance(block.content, str) else str(block.content),
                        "is_error": block.is_error,
                    })
            if blocks:
                return {"type": "assistant", "content": blocks}

        elif isinstance(message, ResultMessage):
            return {
                "type": "result",
                "is_error": message.is_error,
                "total_cost_usd": message.total_cost_usd,
                "num_turns": message.num_turns,
                "session_id": message.session_id,
                "result": message.result,
            }

        return None

    def stop(self):
        """Disconnect the agent and stop the event loop."""
        if self._loop and self._client:
            asyncio.run_coroutine_threadsafe(
                self._client.disconnect(), self._loop
            )
        if self._loop:
            self._loop.call_soon_threadsafe(self._loop.stop)


# Global session registry
_sessions = {}


def create_session(data_dir, repo_dir, api_key=None, model=None, lab_name=None):
    """Create a new agent session and return its ID."""
    session_id = str(uuid.uuid4())

    # Persist session metadata to disk
    create_session_record(session_id, data_dir)

    api_config = APIConfig(api_key=api_key, model=model)
    agent = ConversionAgent(
        session_id=session_id,
        data_dir=data_dir,
        repo_dir=repo_dir,
        api_config=api_config,
        lab_name=lab_name,
    )
    agent.start()
    _sessions[session_id] = agent
    return session_id


def get_session(session_id):
    """Get an agent session by ID."""
    return _sessions.get(session_id)


def remove_session(session_id):
    """Stop and remove an agent session."""
    agent = _sessions.pop(session_id, None)
    if agent:
        agent.stop()
