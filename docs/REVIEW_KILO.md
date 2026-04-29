# Review of Staged Diff

## Summary
This diff implements the "council-workflow" system - a peer-review framework for coding agents using Gemini CLI and Kilo AI Gateway. The changes include command definitions, git hooks, installation scripts, and documentation. However, there are several critical issues that need addressing, particularly around portability and error handling.

## High-risk issues

### 1. Hardcoded absolute Windows path in `kilo.jsonc`
**File:** `kilo.jsonc` (lines 5-6)
```json
"command": ["node", "C:\\ai-tools\\council-workflow-repo\\mcp\\server.mjs"]
```
**Severity:** Critical
**Issue:** This completely breaks the "portable with zero hardcoded absolute paths" principle stated in `docs/PLAN.md`. The path is hardcoded to a specific Windows machine. This will fail on all other systems (Linux, macOS, other Windows machines).

### 2. Removed error handling in `block-commit-without-review.mjs`
**File:** `.gemini/hooks/block-commit-without-review.mjs` (lines 1-16)
**Severity:** High
**Issue:** The original code had proper try-catch and empty input checks. The new version catches errors but immediately exits with `process.exit(0)` and writes `"{}"` to stdout, which may allow commits to proceed when they should be denied. The logic for handling empty/malformed input is now brittle and could let invalid states pass.

### 3. Inconsistent installation paths in `install-kilo-mcp.mjs`
**File:** `scripts/install-kilo-mcp.mjs` (line 10)
**Severity:** High
**Issue:** The script now writes to `kilo.jsonc` in repo root, but:
- `docs/PLAN.md` line 23 mentions `.kilo/kilo.jsonc` as the target
-