#!/usr/bin/env python3
"""PreToolUse hook: validates git commit messages against the project convention.

Convention (from AGENTS.md):
  Format: <scope>: <short description>
  Scopes: slide, visual, build, agent, project

Triggered when the agent tries to commit via:
  - run_in_terminal / send_to_terminal (command containing "git commit")
"""

import json
import re
import sys

# ── config ──────────────────────────────────────────────────────────────
VALID_SCOPES = {
    "slide":   "Changes to slide content (presentation.en.md, presentation.vi.md)",
    "visual":  "Theme, styling, CSS, build.cjs visual changes",
    "build":   "Build configuration, scripts, dependencies",
    "agent":   "AI agent configuration, instructions, skills",
    "project": "README, AGENTS.md, project setup, misc config",
}
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
        f"  - `{k}` — {v}" for k, v in VALID_SCOPES.items()
    )
    return (
        "REMINDER: Commit message does not follow the project convention "
        "defined in AGENTS.md.\n\n"
        "**Expected format:** `<scope>: <short description>`\n"
        f"**Valid scopes:**\n{scopes_list}\n\n"
        f'**Current message:** `"{msg}"`\n\n'
        "Please adjust the commit message to match this convention before proceeding."
    )


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
