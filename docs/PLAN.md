# Plan: Council Workflow Upgrade (Apr 2026)

Upgrade the `council-workflow` repository to follow the latest agentic coding standards for Gemini CLI, Antigravity, and Kilo Code.

## Goals
- Restructure the repository for portability (no absolute paths).
- Implement external council review using Kilo Gateway (`kilo-auto/free`).
- Add Gemini CLI custom commands and anti-skip hooks.
- Provide automated MCP installation scripts for both Antigravity and Kilo Code.
- Update documentation (README) and repository structure.

## Proposed Changes

### Structure
- `cli/` -> (moved/deleted)
- `config/` -> `config-examples/`
- `scripts/` (NEW/UPDATED)
- `.gemini/commands/council/` (NEW)
- `.gemini/hooks/` (NEW)
- `docs/` (UPDATED)

### Files to Create/Update
- `scripts/kilo_review.mjs`: Portable review logic using fetch.
- `.gemini/commands/council/review.toml`: Command to trigger Kilo review.
- `.gemini/commands/council/review-apply.toml`: Command to apply review findings.
- `.gemini/hooks/block-commit-without-review.mjs`: Hook to prevent commits without review.
- `.gemini/settings.json`: Enable hooks.
- `scripts/install-antigravity-mcp.mjs`: Setup script for Antigravity.
- `scripts/install-kilo-mcp.mjs`: Setup script for Kilo Code (writes to root `kilo.jsonc`).
- `README.md`: Updated quickstart.

## Verification
- Run `node scripts/install-antigravity-mcp.mjs` and verify `~/.gemini/antigravity/mcp_config.json`.
- Run `node scripts/install-kilo-mcp.mjs` and verify `kilo.jsonc`.
- Test `/council:review` (after commit/staging).
- Verify git commit hook blocks commits if `docs/REVIEW_KILO.md` is missing.
