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
    delete_session_record,
    get_session_history,
)
from ai.session_store import list_sessions as list_saved_sessions
from flask import Response, request
from flask_restx import Namespace, Resource
from manageNeuroconv.info import CONVERSION_SAVE_FOLDER_PATH

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
            data_dir (str): Path to the data directory to convert.
            api_key (str, optional): Anthropic API key.
            model (str, optional): Model to use.
            lab_name (str, optional): Lab name for monitoring.
        """
        payload = ai_namespace.payload or {}
        data_dir = payload.get("data_dir")

        if not data_dir:
            return {"message": "data_dir is required"}, 400

        if not os.path.isdir(data_dir):
            return {"message": f"data_dir does not exist: {data_dir}"}, 400

        # Create a repo directory inside GUIDE's conversions folder
        lab_name = payload.get("lab_name", "lab")
        repo_name = f"{lab_name}-to-nwb"
        repo_dir = str(CONVERSION_SAVE_FOLDER_PATH / repo_name)
        os.makedirs(repo_dir, exist_ok=True)

        session_id = create_session(
            data_dir=data_dir,
            repo_dir=repo_dir,
            api_key=payload.get("api_key"),
            model=payload.get("model"),
            lab_name=lab_name,
        )

        return {"session_id": session_id, "repo_dir": repo_dir}


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
                "data_dir": agent.data_dir,
                "repo_dir": agent.repo_dir,
                "connected": agent._connected,
            }

        # Fall back to saved session history
        history = get_session_history(session_id)
        if history:
            return {
                "session_id": session_id,
                "data_dir": history["data_dir"],
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
