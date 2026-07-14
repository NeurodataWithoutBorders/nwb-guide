"""Flask-RESTX namespace for the AI conversion assistant.

Provides endpoints to create agent sessions, send messages, and stream
responses via Server-Sent Events (SSE).
"""

import json
import os
import time
from pathlib import Path

from ai.agent import create_session, get_session, remove_session
from ai.session_store import (
    CONVERSIONS_DIR,
    SESSIONS_DIR,
    delete_session_record,
    get_session_history,
)
from ai.session_store import list_sessions as list_saved_sessions
from flask import Response, request
from flask_restx import Namespace, Resource

ai_namespace = Namespace("ai", description="AI conversion assistant")


@ai_namespace.route("/sessions")
class Sessions(Resource):
    @ai_namespace.doc(
        responses={200: "Success"},
        description="List all saved AI sessions.",
    )
    def get(self):
        """List all saved sessions (most recent first)."""
        return {"sessions": list_saved_sessions()}

    @ai_namespace.doc(
        responses={200: "Success", 400: "Bad Request", 500: "Internal server error"},
        description="Create a new AI agent session for NWB conversion.",
    )
    def post(self):
        """Create a new agent session.

        Payload:
            data_dirs (list[str]): Paths to data directories to convert.
            data_dir (str): Legacy single path (used if data_dirs not provided).
            api_key (str, optional): Anthropic API key.
            model (str, optional): Model to use.
            lab_name (str, optional): Lab name for monitoring.
        """
        payload = ai_namespace.payload or {}

        # Support both data_dirs (list) and legacy data_dir (string)
        data_dirs = payload.get("data_dirs") or []
        if not data_dirs:
            single = payload.get("data_dir")
            if single:
                data_dirs = [single]

        if not data_dirs:
            return {"message": "At least one data directory is required"}, 400

        for d in data_dirs:
            if not os.path.isdir(d):
                return {"message": f"data_dir does not exist: {d}"}, 400

        # Derive a label from the first data directory name
        label = Path(data_dirs[0]).name.replace(" ", "-").lower()
        repo_name = f"{label}-to-nwb"

        # Use datetime as session ID (filesystem-safe, sortable)
        from datetime import datetime, timezone

        session_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

        # Code repo lives at [NWB_GUIDE_DIR]/ai-sessions/<session_id>/<label>-to-nwb
        session_dir = SESSIONS_DIR / session_id
        repo_dir = str(session_dir / repo_name)
        os.makedirs(repo_dir, exist_ok=True)

        # NWB output lives at [NWB_GUIDE_DIR]/conversions/<session_id>/<label>-to-nwb
        output_dir = str(CONVERSIONS_DIR / session_id / repo_name)
        os.makedirs(output_dir, exist_ok=True)

        result = create_session(
            session_id=session_id,
            data_dirs=data_dirs,
            repo_dir=repo_dir,
            output_dir=output_dir,
            api_key=payload.get("api_key"),
            model=payload.get("model"),
        )

        return {
            "session_id": session_id,
            "repo_dir": repo_dir,
            "output_dir": output_dir,
            "auth_mode": result["auth_mode"],
        }


@ai_namespace.route("/sessions/<string:session_id>")
class Session(Resource):
    @ai_namespace.doc(
        responses={200: "Success", 404: "Not Found"},
        description="Get session state or history.",
    )
    def get(self, session_id):
        """Get session state (active) or full history (saved)."""
        # Check if this is an active session
        agent = get_session(session_id)
        if agent:
            return {
                "session_id": session_id,
                "data_dirs": agent.data_dirs,
                "repo_dir": agent.repo_dir,
                "connected": agent._connected,
                "auth_mode": agent.auth_mode,
            }

        # Fall back to saved session history
        history = get_session_history(session_id)
        if history:
            # Support both old (data_dir) and new (data_dirs) format
            data_dirs = history.get("data_dirs") or ([history["data_dir"]] if history.get("data_dir") else [])
            return {
                "session_id": session_id,
                "data_dirs": data_dirs,
                "title": history["title"],
                "created_at": history["created_at"],
                "updated_at": history["updated_at"],
                "connected": False,
                "messages": history["messages"],
            }

        return {"message": "Session not found"}, 404

    @ai_namespace.doc(
        responses={200: "Success", 404: "Not Found"},
        description="Delete (stop) a session.",
    )
    def delete(self, session_id):
        """Stop and remove a session.

        Query params:
            delete_history (bool): If true, also delete the saved record on disk.
                Default is false (keeps history for the session list).
        """
        agent = get_session(session_id)
        if agent:
            remove_session(session_id)

        delete_history = request.args.get("delete_history", "false").lower() == "true"
        deleted = False
        if delete_history:
            deleted = delete_session_record(session_id)

        if not agent and not deleted:
            return {"message": "Session not found"}, 404

        return {"status": "stopped"}


@ai_namespace.route("/sessions/<string:session_id>/message")
class Message(Resource):
    @ai_namespace.doc(
        responses={200: "Success", 400: "Bad Request", 404: "Not Found"},
        description="Send a user message to the agent.",
    )
    def post(self, session_id):
        """Send a user message to the agent.

        Payload:
            content (str): The message text.
        """
        agent = get_session(session_id)
        if not agent:
            return {"message": "Session not found"}, 404

        payload = ai_namespace.payload or {}
        content = payload.get("content", "")

        if not content:
            return {"message": "content is required"}, 400

        agent.send_message(content)
        return {"status": "ok"}


@ai_namespace.route("/sessions/<string:session_id>/interrupt")
class Interrupt(Resource):
    @ai_namespace.doc(
        responses={200: "Success", 404: "Not Found"},
        description="Interrupt the agent's current turn.",
    )
    def post(self, session_id):
        """Interrupt the agent so the user can interject."""
        agent = get_session(session_id)
        if not agent:
            return {"message": "Session not found"}, 404

        agent.interrupt()
        return {"status": "interrupted"}


@ai_namespace.route("/sessions/<string:session_id>/events")
class Events(Resource):
    @ai_namespace.doc(
        responses={200: "Success", 404: "Not Found"},
        description="SSE stream of agent responses.",
    )
    def get(self, session_id):
        """Stream agent responses as Server-Sent Events."""
        agent = get_session(session_id)
        if not agent:
            return {"message": "Session not found"}, 404

        def generate():
            while True:
                try:
                    # Block for up to 30 seconds waiting for a message
                    event = agent.message_queue.get(timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"

                    # If this is a result message, the turn is done
                    if event.get("type") == "result":
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"

                except Exception:
                    # Send a keepalive comment to prevent timeout
                    yield ": keepalive\n\n"

        return Response(
            generate(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
