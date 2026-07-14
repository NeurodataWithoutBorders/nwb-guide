"""Manage API configuration and billing mode for the AI assistant.

Three-tier auto-detected billing:
  1. subscription — Claude Code is authenticated (Max plan or ANTHROPIC_API_KEY env var)
  2. api_key     — User entered an API key in Settings
  3. proxy       — Neither exists; route through CatalystNeuro free-credit proxy
"""

import os
import shutil

PROXY_URL = "https://nwb-conversions-proxy.ben-dichter.workers.dev"
DEFAULT_MODEL = "claude-sonnet-4-5-20250929"


class APIConfig:
    """Manages API configuration for the conversion agent."""

    def __init__(self, api_key=None, model=None):
        self.api_key = api_key
        self.model = model or DEFAULT_MODEL
        self.auth_mode = self._detect_mode()

    def _detect_mode(self):
        # 1. ANTHROPIC_API_KEY in system env (explicit API key config)
        if os.environ.get("ANTHROPIC_API_KEY"):
            return "subscription"
        # 2. Claude CLI is installed → Max subscription or authenticated CLI
        #    The Agent SDK communicates through the CLI, so if it's on PATH
        #    the user has working auth (Max OAuth or CLI-configured key).
        if shutil.which("claude"):
            return "subscription"
        # 3. User supplied an API key through the Settings UI
        if self.api_key:
            return "api_key"
        # 4. Fall back to CatalystNeuro proxy
        return "proxy"

    def to_env(self, session_id=None):
        """Return environment variables for the agent process."""
        env = {}
        if self.auth_mode == "api_key":
            env["ANTHROPIC_API_KEY"] = self.api_key
        elif self.auth_mode == "proxy":
            # Encode session_id in the API key so the proxy can track budgets.
            # The proxy extracts it from the x-api-key header.
            key = f"proxy:{session_id}" if session_id else "proxy"
            env["ANTHROPIC_API_KEY"] = key
            env["ANTHROPIC_BASE_URL"] = PROXY_URL
        # subscription mode: don't set anything, let the SDK use its own auth
        return env
