#!/usr/bin/env python3
"""PreToolUse hook: validates git commit messages against the project convention.

Scopes are defined in ../scopes.json (single source of truth).
"""

import json
import re
import sys
from pathlib import Path

# ── read scopes from canonical JSON file ─────────────────────────────────
_SCOPES_JSON = Path(__file__).resolve().parent.parent / "scopes.json"
VALID_SCOPES: dict[str, str] = json.loads(_SCOPES_JSON.read_text(encoding="utf-8"))
SCOPE_PATTERN = re.compile(r"^(?P<scope>" + "|".join(VALID_SCOPES) + r"):\s+(?P<desc>.+)$")

# ── helpers ─────────────────────────────────────────────────────────────

def extract_message(data: dict) -> str | None:
    """Return the commit message from tool input, or None if not a commit."""
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    # MCP commit tool
    if re.search(r"git_add_or_commit|git.*commit", tool_name, re.IGNORECASE):
        if tool_input.get("action") == "commit":
            return tool_input.get("message", "").strip()

    # Terminal git commit
    if re.search(r"run_in_terminal|send_to_terminal", tool_name, re.IGNORECASE):
        cmd = tool_input.get("command", "")
        if re.search(r"git commit", cmd, re.IGNORECASE):
            m = re.search(r"""-m ['"]([^'"]+)['"]""", cmd)
            if m:
                return m.group(1).strip()

    return None


def build_reminder(msg: str) -> str:
    """Build the additional context string."""
    scopes_list = "\n".join(
        f"  - `{k}` - {v}" for k, v in VALID_SCOPES.items()
    )
    return f"""
            REMINDER: Commit message does not follow the project convention
            **Expected format:** `<scope>: <short description>`
            **Valid scopes:**
            {scopes_list}
            **Current message:** `"{msg}"`

            Please adjust the commit message to match this convention before proceeding.
            """


def main() -> None:
    data = json.load(sys.stdin)
    commit_msg = extract_message(data)

    if commit_msg and not SCOPE_PATTERN.match(commit_msg):
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Commit message does not follow project convention",
                "additionalContext": build_reminder(commit_msg),
            }
        }
        json.dump(output, sys.stdout)
        sys.exit(0)

    # Not a commit, or message is valid — pass through
    json.dump({}, sys.stdout)


if __name__ == "__main__":
    main()
