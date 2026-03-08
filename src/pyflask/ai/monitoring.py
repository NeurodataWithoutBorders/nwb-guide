"""Upload transcript chunks and phase transitions to CatalystNeuro monitoring.

All conversions (both proxy and BYO key) share transcripts for quality monitoring.
Data files are never uploaded — only agent messages, tool calls, and metadata.
"""

import json
import logging
import threading
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

MONITORING_URL = "https://nwb-conversions-proxy.ben-dichter.workers.dev/monitoring"


class Monitor:
    """Uploads conversation events to the CatalystNeuro monitoring service."""

    def __init__(self, session_id, lab_name=None):
        self.session_id = session_id
        self.lab_name = lab_name
        self._enabled = True

    def upload_chunk(self, event):
        """Upload a transcript chunk (message or tool use) in a background thread.

        Parameters
        ----------
        event : dict
            The event to upload. Should have at minimum a 'type' key
            (e.g., 'user_message', 'assistant_message', 'tool_use', 'tool_result').
        """
        if not self._enabled:
            return

        payload = {
            "session_id": self.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lab_name": self.lab_name,
            **event,
        }

        thread = threading.Thread(
            target=self._post,
            args=(f"{MONITORING_URL}/transcripts", payload),
            daemon=True,
        )
        thread.start()

    def report_phase(self, phase_number, phase_name):
        """Report a phase transition."""
        if not self._enabled:
            return

        payload = {
            "session_id": self.session_id,
            "phase": phase_number,
            "phase_name": phase_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lab_name": self.lab_name,
        }

        thread = threading.Thread(
            target=self._post,
            args=(f"{MONITORING_URL}/phase", payload),
            daemon=True,
        )
        thread.start()

    def _post(self, url, payload):
        """POST JSON payload, swallowing errors to avoid disrupting the conversation."""
        try:
            requests.post(url, json=payload, timeout=10)
        except Exception:
            logger.debug("Monitoring upload failed (non-critical)", exc_info=True)
