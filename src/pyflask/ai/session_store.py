"""Persist AI session metadata and messages to disk.

Sessions are stored as JSON files in ~/NWB_GUIDE/ai-sessions/<session_id>.json.
Each file contains:
  - session_id
  - title (derived from first user message or data_dir)
  - data_dir
  - created_at (ISO timestamp)
  - updated_at (ISO timestamp)
  - messages (list of {role, content} dicts)
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from manageNeuroconv.info.urls import GUIDE_ROOT_FOLDER

logger = logging.getLogger(__name__)

SESSIONS_DIR = Path(GUIDE_ROOT_FOLDER) / "ai-sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)


def _session_path(session_id: str) -> Path:
    return SESSIONS_DIR / f"{session_id}.json"


def create_session_record(session_id: str, data_dir: str, title: str = "") -> dict:
    """Create a new session record on disk."""
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "session_id": session_id,
        "title": title or f"Conversion — {Path(data_dir).name}",
        "data_dir": data_dir,
        "created_at": now,
        "updated_at": now,
        "messages": [],
    }
    _session_path(session_id).write_text(json.dumps(record, indent=2))
    return record


def append_message(session_id: str, role: str, content) -> None:
    """Append a message to a session's history on disk."""
    path = _session_path(session_id)
    if not path.exists():
        return

    try:
        record = json.loads(path.read_text())
        record["messages"].append({"role": role, "content": content})
        record["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Derive title from first user message if still default
        if role == "user" and isinstance(content, str) and record["title"].startswith("Conversion"):
            # Use first 60 chars of first real user message as title
            first_line = content.strip().split("\n")[0][:60]
            if first_line and not first_line.startswith("I'd like to convert"):
                record["title"] = first_line

        path.write_text(json.dumps(record, indent=2))
    except Exception as e:
        logger.warning(f"Failed to append message to session {session_id}: {e}")


def list_sessions() -> list[dict]:
    """List all saved sessions, sorted by most recently updated."""
    sessions = []
    for path in SESSIONS_DIR.glob("*.json"):
        try:
            record = json.loads(path.read_text())
            sessions.append(
                {
                    "session_id": record["session_id"],
                    "title": record["title"],
                    "data_dir": record["data_dir"],
                    "created_at": record["created_at"],
                    "updated_at": record["updated_at"],
                    "message_count": len(record["messages"]),
                }
            )
        except Exception:
            continue

    sessions.sort(key=lambda s: s["updated_at"], reverse=True)
    return sessions


def get_session_history(session_id: str) -> dict | None:
    """Load full session record including messages."""
    path = _session_path(session_id)
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text())
    except Exception:
        return None


def delete_session_record(session_id: str) -> bool:
    """Delete a session record from disk."""
    path = _session_path(session_id)
    if path.exists():
        path.unlink()
        return True
    return False
