# AI Conversion Assistant

This directory implements the AI-powered NWB conversion assistant in NWB GUIDE. It wraps the [nwb-convert skill](https://github.com/catalystneuro/claude-skills/tree/main/nwb-convert) with the Claude Agent SDK to provide a multi-turn conversation interface.

## Architecture

```
ai/
  __init__.py
  agent.py          # ConversionAgent — wraps ClaudeSDKClient for multi-turn sessions
  api_config.py     # Three-tier auth: subscription → api_key → proxy
  monitoring.py     # Uploads transcripts to CatalystNeuro monitoring service
  session_store.py  # Persists session metadata + messages to ~/NWB_GUIDE/ai-sessions/
  skill_loader.py   # Reads SKILL.md, expands $file: directives into system prompt
  skill/            # Bundled copy of the nwb-convert skill (see below)
```

## Bundled Skill

The `skill/` directory contains a copy of the canonical skill from `catalystneuro/claude-skills`. It includes:

- `SKILL.md` — main skill definition
- `phases/` — 7 phase instructions (01-intake through 07-dandi-upload)
- `knowledge/` — 13 reference files (NeuroConv interfaces, NWB patterns, PyNWB guides, extensions)
- `tools/` — helper scripts (fetch_paper.py)

`skill_loader.py` reads `SKILL.md` and expands `$file:` directives to produce the full system prompt.

## Syncing from Canonical

The canonical source of truth for the skill is:
```
https://github.com/catalystneuro/claude-skills/tree/main/nwb-convert
```

To sync the bundled copy:
```bash
CANONICAL=~/dev/claude-skills-repo/nwb-convert
BUNDLED=~/dev/nwb-guide/src/pyflask/ai/skill

cp "$CANONICAL/SKILL.md" "$BUNDLED/SKILL.md"
cp "$CANONICAL/phases/"*.md "$BUNDLED/phases/"
cp "$CANONICAL/knowledge/"*.md "$BUNDLED/knowledge/"
cp "$CANONICAL/knowledge/"*.yaml "$BUNDLED/knowledge/"
cp "$CANONICAL/tools/fetch_paper.py" "$BUNDLED/tools/"
```

After syncing, verify with:
```bash
diff -r "$CANONICAL" "$BUNDLED" --exclude='__pycache__'
```

The only expected difference: canonical has `nwb-data-model.md` in `knowledge/` if it exists there but not in the bundled copy — check and include any new files.

## Hardcoded URLs

These URLs appear in the Python modules and must be updated if services move:

| File | URL | Purpose |
|------|-----|---------|
| `api_config.py` | `https://nwb-conversions-proxy.ben-dichter.workers.dev` | Free-tier API proxy |
| `monitoring.py` | `https://nwb-conversions-proxy.ben-dichter.workers.dev/monitoring` | Transcript monitoring |

The infrastructure source code lives at [catalystneuro/nwb-conversions-infra](https://github.com/catalystneuro/nwb-conversions-infra).

## Auth Modes

`APIConfig` auto-detects three billing tiers (see `api_config.py`):

1. **subscription** — `ANTHROPIC_API_KEY` env var set, or `claude` CLI on PATH (Max plan)
2. **api_key** — user entered their own API key in the GUIDE Settings UI
3. **proxy** — fallback to CatalystNeuro free-credit proxy ($5/session, $50/day caps)
