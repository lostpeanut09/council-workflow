---
name: code-analysis-audit
description: "Code analysis, audit, debug, and review skill. Use when asked to: review this code, audit this, find bugs, analyze, debug, fix this, ho sistemato ricontrolla, what's wrong with, is this correct, can you check, re-check this. Covers any systematic code quality assessment or error report request. When in doubt: use this skill — undertriggering is worse than overtriggering."
argument-hint: "[paste code, file path, or task description]"
allowed-tools:
  - Read
  - Bash(git:*)
  - Search
license: MIT
metadata:
  author: user-defined
  version: "11.0.0"
---

# Code Analysis & Audit Skill
> v13.0 · April 2026
> Scientific basis: arXiv:2603.10047 (Mar 2026) · arXiv:2505.09031 (May 2025)
> DeCRIM arXiv:2410.06458 · arXiv:2510.24476 · obra/superpowers (skills.sh)

## Notes
This is the repo’s local “discipline” skill. Keep it here so it can be installed to multiple agents with:
`npx skills add . --skill code-analysis-audit -a antigravity -a gemini-cli -a kilo -a warp -y`

## Skill Body

### STEP 0: Context Gathering
- Use `Read` and `Search` to understand the codebase structure and existing patterns.
- Identify the core logic and dependencies related to the request.

### STEP 1: Identification
- Locate the specific lines of code or files mentioned in the task.
- Use `Bash(git:diff)` or `git log` to see recent changes if relevant.

### STEP 2: Systematic Analysis
- Perform a line-by-line review.
- Check for common pitfalls: memory leaks, race conditions, absolute paths, or lack of error handling.
- Audit against the project's specific standards (e.g., April 2026 agentic best practices).

### STEP 3: Mitigation & Fixes
- Propose concrete, testable fixes.
- Prioritize HIGH and MEDIUM risk issues.
- Group fixes by component.

### STEP 4: Verification
- If possible, run tests or simulation commands.
- Verify that the fix doesn't introduce regressions.

### STEP 5: Final Report
- Summarize the findings.
- List remaining risks.
- Provide a clear prioritized TODO list.
