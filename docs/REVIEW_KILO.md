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
**File:** `.gemini/hooks/block-commit-without-review.mjs` (lines 1-9)
**Severity:** High
**Issue:** The original code had try-catch and empty input checks. The simplified version will crash with uncaught exceptions if stdin is empty, malformed JSON, or read errors occur. This makes the git hook brittle.

### 3. Inconsistent installation paths in `install-kilo-mcp.mjs`
**File:** `scripts/install-kilo-mcp.mjs` (line 10)
**Severity:** High
**Issue:** The script now writes to `kilo.jsonc` in repo root, but:
- `docs/PLAN.md` line 23 mentions `.kilo/kilo.jsonc` as the target
- The original code created `.kilo/kilo.jsonc`
- The README mentions "installa in ./.kilo/"
This creates confusion about where the config actually lives.

## Medium issues

### 4. Missing server validation in `install-kilo-mcp.mjs`
**File:** `scripts/install-kilo-mcp.mjs` (lines 7-11)
**Severity:** Medium
**Issue:** The script checks if `server.mjs` exists but doesn't verify it's executable or valid. Should also check that the MCP server can actually be invoked.

### 5. Italian-only README
**File:** `README.md`
**Severity:** Medium
**Issue:** The README is now entirely in Italian ("Requisiti", "Setup", etc.). This reduces accessibility for non-Italian speakers and contradicts the likely international nature of the project.

### 6. Backward compatibility concerns
**File:** `scripts/install-kilo-mcp.mjs` (line 10)
**Severity:** Medium
**Issue:** Changing the config location from `.kilo/kilo.jsonc` to `kilo.jsonc` is a breaking change. Existing users' configurations will be ignored. Should support both locations or provide migration.

## Low/nits

### 