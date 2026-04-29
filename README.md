# Council Workflow

A portable peer-review system for coding agents using Gemini CLI and Kilo AI Gateway.

## Installation

1. Clone the repository to a local directory.
2. Register the MCP server in Antigravity:
   ```bash
   node scripts/install-antigravity-mcp.mjs
   ```
3. Register the Gemini CLI commands by symlinking or copying `.gemini/commands/council/` to your global commands directory.

## Usage

1. Stage your changes with `git add`.
2. Run `/council:review` to generate a technical review in `docs/REVIEW_KILO.md`.
3. Run `/council:review-apply` to automatically implement high and medium priority fixes.

## Features

- External code review via Kilo AI Gateway (kilo-auto/free).
- Automated PR reviews through GitHub Actions.
- Portable configuration with zero hardcoded absolute paths.
- Integration with the ECC Decision Council for strategic trade-offs.

---
April 2026
