"""Manage API key for the AI assistant.

The user provides their Anthropic API key. The Claude Agent SDK reads it
from the ANTHROPIC_API_KEY environment variable.
"""

DEFAULT_MODEL = "claude-sonnet-4-5-20250929"


class APIConfig:
    """Manages API configuration for the conversion agent."""

    def __init__(self, api_key=None, model=None):
        self.api_key = api_key
        self.model = model or DEFAULT_MODEL

    def to_env(self):
        """Return environment variables for the agent process."""
        env = {}
        if self.api_key:
            env["ANTHROPIC_API_KEY"] = self.api_key
        return env
