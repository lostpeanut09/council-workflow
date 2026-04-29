# Council Workflow

A portable, global peer-review system for coding agents, powered by **Gemini CLI** and **Kilo AI Gateway**.

## 🚀 Quickstart

1. **Clone this repo** to a stable location (e.g., `C:\ai-tools\council-workflow`).
2. **Install Antigravity MCP**:
   ```bash
   node scripts/install-antigravity-mcp.mjs
   ```
3. **Register Gemini CLI Commands**:
   If you have Gemini CLI installed, the commands in `.gemini/commands/council/` are automatically discovered if you work within this repo, or you can symlink them to `~/.gemini/commands/`.
4. **Initialize GSD (Optional but Recommended)**:
   ```bash
   npx get-shit-done-cc --antigravity --local
   ```

## 🛠 Usage Flow

1. **Stage your changes**: `git add .`
2. **Run Review**: Use the `/council:review` command. This calls **Kilo Gateway** (`kilo-auto/free`) and saves the feedback to `docs/REVIEW_KILO.md`.
3. **Apply Fixes**: Use `/council:review-apply`. The agent will read the review and automatically implement HIGH and MEDIUM priority fixes while adding tests.

## 🛡 Features
- **Zero Cost**: Uses Kilo's free-tier anonymous routing.
- **Portable**: No hardcoded absolute paths.
- **Automated**: Integrated PR reviews via GitHub Actions.
- **Senior Guardrails**: Enforces a non-skippable review-before-merge culture.

---
*Created for the April 2026 Agentic Workflow standards.*
