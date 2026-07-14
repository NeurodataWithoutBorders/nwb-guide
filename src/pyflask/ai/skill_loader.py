"""Load and expand the nwb-convert skill into a system prompt.

Reads SKILL.md and expands `$file:` directives that include phase-specific
instructions and knowledge files.
"""

import re
from pathlib import Path


def load_skill(skill_dir=None):
    """Load SKILL.md and expand $file: includes, return full system prompt.

    Parameters
    ----------
    skill_dir : str or Path, optional
        Path to the skill directory containing SKILL.md.
        Defaults to the bundled skill/ directory next to this file.

    Returns
    -------
    str
        The fully expanded system prompt text.
    """
    if skill_dir is None:
        skill_dir = Path(__file__).parent / "skill"

    skill_dir = Path(skill_dir)
    skill_md = (skill_dir / "SKILL.md").read_text()

    # Strip YAML frontmatter (between --- markers)
    if skill_md.startswith("---"):
        parts = skill_md.split("---", 2)
        if len(parts) >= 3:
            skill_md = parts[2]

    # Expand $file: directives — these reference relative paths from the skill dir
    def expand(match):
        rel_path = match.group(1).strip()
        file_path = skill_dir / rel_path
        if file_path.exists():
            return file_path.read_text()
        else:
            return f"[WARNING: File not found: {rel_path}]"

    expanded = re.sub(r"^\$file:\s*(.+)$", expand, skill_md, flags=re.MULTILINE)

    return expanded.strip()
