---
name: code-analysis-audit
description: "Code analysis, audit, debug, and review skill. Use for systematic code quality assessment or error report requests."
argument-hint: "[paste code, file path, or task description]"
allowed-tools:
  - Read
  - Bash(git:*)
  - Search
license: MIT
metadata:
  author: lostpeanut09
  version: "11.0.0"
---

# Code Analysis & Audit Skill (April 2026)

## Hard rules
1) **NO GATE SKIP**: ogni step deve produrre la tabella richiesta prima di passare oltre.
2) **NO TOOL INVENTION**: se un tool non c’è, dichiaralo. Niente risultati simulati.
3) **ROOT CAUSE BEFORE FIX**: prima la causa, poi la fix.

## Steps (condensed)
### STEP 0 — Glossary
Output table: Term | Definition.

### STEP 1 — Task analysis
Output tables:
- Success criteria (3)
- Constraints decomposition

### STEP 2 — Check online (April 2026)
Run a test search query and report real URLs + dates.

### STEP 3 — Findings
Output:
- Raw facts table
- Findings by severity (Critical/Medium/Low) with root cause + validation

### STEP 4 — Fix
Provide one executable fix task + verification command + expected output, plus 2 alternatives.

### STEP 5 — Self verification
Write initial answer, 3–4 verification questions, reconcile, then revised answer.
