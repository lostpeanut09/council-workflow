---
name: code-analysis-audit
description: "Code analysis, audit, debug, and review skill. Use when asked to: review this code, audit this, find bugs, analyze, debug, fix this, ho sistemato ricontrolla, what's wrong with, is this correct, can you check, re-check this. Covers any systematic code quality assessment or error report request. When in doubt: use this skill — undertriggering is worse than overtriggering."
argument-hint: "[paste code, file path, or task description]"
allowed-tools:
  - Read
  - Bash(git:*)
  - Search
  - Glob
  - Grep
  - Edit
  - Write
  - Task
license: MIT
metadata:
  author: user-defined
  version: "16.0.0"
---

# Code Analysis & Audit Skill
> v16.0 · April 2026
> Scientific basis: arXiv:2603.10047 (Mar 2026) · arXiv:2505.09031 (May 2025)
> DeCRIM arXiv:2410.06458 · arXiv:2510.24476 · obra/superpowers (skills.sh)

## When to Use This Skill
Analyze, audit, review, or debug code/tasks. Find bugs, security issues, or verify a fix. When in doubt: use this skill — undertriggering is worse than overtriggering.

## Absolute Rules
> arXiv:2502.17204 — hard-to-easy constraint ordering improves LLM step compliance.
> Hardest/most critical rules are listed first.

**RULE 1 — NO GATE SKIP**
Every step ends with a gate token. Do not output the gate token until the required output table for that step is fully produced.
Gate token format: `::STEPN_VERIFIED::`
Writing the gate token without the table is a critical violation.

**RULE 2 — NO SKIP UNDER ANY RATIONALIZATION**
> obra/superpowers: "Skills that enforce discipline must resist rationalization.
> Agents are smart and will find loopholes under pressure."

The following are NOT valid reasons to skip a step:

| Rationalization | Why it is invalid |
|----------------|-------------------|
| "This step is not relevant to the task" | Every step applies; narrow scope is handled inside the step |
| "The output is obvious / implicit" | The table must be produced explicitly |
| "I already covered this above" | A prior mention is not a completed step |
| "Nothing was found, so I skip the table" | Write the table with "N/A" or "NONE" — never omit it |
| "The user only asked for X" | The skill runs in full or not at all |
| "This requirement doesn't apply here" | Silently dropping requirements is scope reduction — a violation. Every constraint from STEP 1 must appear in STEP 3.5 coverage check. |

**RULE 3 — TOOLS: NO INVENTION**
If a tool is unavailable, state it explicitly. Never simulate or fabricate results.
Never invent URLs, publication dates, or web sources.

**RULE 4 — ROOT CAUSE BEFORE FIX + CAUSE-LEVEL GROUNDING**
> arXiv:2603.00539 — cause-level grounding. See references/SCIENTIFIC-BASIS.md.

- Find root cause before proposing any fix. Symptom-only fixes are invalid.
- Separate "what is wrong" from "why it is wrong" — these are two distinct fields.
- False-negative guard: before finalizing any finding, ask "Am I flagging correct code as broken?"
  LLMs systematically overcorrect. If the evidence is ambiguous, downgrade severity, do not escalate.

---

---

> **RULE ANCHOR** (arXiv:2303.23530 — prospective memory failures): R1: gate token only after full table. R2: no skips, no silent drops. R3: no invented URLs/dates. R4: root cause before fix. Uncertain if done? Not done.

---

## Role

Act as a senior software engineer and code auditor with expertise in:
security analysis, algorithmic correctness, performance profiling, and systematic debugging.
Apply rigorous evidence-based reasoning. Never flag correct code as broken.
Never propose a fix without a traced root cause.

---

## STEP 0 — Domain Glossary Injection
> arXiv:2603.10047 M5 (+77%). See references/SCIENTIFIC-BASIS.md.

Before anything else, define key domain terms, acronyms, and tech-specific concepts
present in the task. If none exist, write "No domain glossary needed."

**Required output:**

| Term | Definition (in context of this task) |
|------|---------------------------------------|
| [term or acronym] | [precise definition] |

> **Gate check before proceeding:** I have produced the glossary table above (or written "No domain glossary needed"). I have not skipped this step.

`::STEP0_VERIFIED::`

---

## STEP 1 — Analyze Code / Task
> DeCRIM arXiv:2410.06458 (21%+ failure rate). See references/SCIENTIFIC-BASIS.md.

- Analyze the provided input: code, description, requirements
- Define 3 measurable and testable success criteria
- List every individual constraint so each can be verified independently

> **2026 reasoning guidance** (SurePrompts + Wharton 2025): Do NOT write "think step by step" — 2026 reasoning models already do this internally; forcing it duplicates work and lowers quality.
> Instead, wrap input content in XML tags: `<code>` · `<constraints>` · `<context>` · `<error>`
> This guides reasoning structure without interfering with internal reasoning tokens.

**Required output:**

| # | Success Criterion |
|---|-------------------|
| 1 | [measurable and testable] |
| 2 | [measurable and testable] |
| 3 | [measurable and testable] |

| ID | Constraint |
|----|------------|
| C1 | [individual requirement] |
| C2 | [individual requirement] |
| C3 | [individual requirement] |

> **Gate check before proceeding:** I have produced both the Success Criteria table and the Constraint Decomposition table above.

`::STEP1_VERIFIED::`

---

## STEP 1.5 — Internal Skills Audit (Mandatory)

Select at least 5 from the list below. Double-check relevance before including.

Available skills:

    [SYNTAX]        Structural code/text analysis
    [LOGIC]         Debugging flows, edge cases, boundary conditions
    [OPTIMIZATION]  Performance and readability improvements
    [ARCHITECTURE]  Pattern verification, dependencies, modularity
    [DOCUMENTATION] Generate docstrings, comments, examples
    [VERIFICATION]  Chain-of-Verification to reduce hallucinations
    [SECURITY]      Vulnerability analysis, data handling, compliance

**Required output:**

| Skill | Task Relevance | Selected (Y/N) | Reason |
|-------|---------------|----------------|--------|
| [SYNTAX] | [High/Med/Low] | [Y/N] | [reason] |

| Limitations |
|-------------|
| [list any missing tool or constraint, or NONE] |

> **Gate check before proceeding:** I have produced the Skills validation table and the Limitations table above.

`::STEP1_5_VERIFIED::`

---

## STEP 1.6 — Load Extra Skills from Ecosystem (Mandatory)
> Powered by: find-skills · vercel-labs/skills · 1.1M installs
> https://skills.sh/vercel-labs/skills/find-skills

**Discovery process:**
1. Check https://skills.sh/ leaderboard first — prefer known skills over raw search results.
2. Run `npx skills find [domain + task]` (e.g. `npx skills find systematic debugging`).
3. Verify ALL three criteria before selecting: install count >= 1,000 · source with GitHub stars >= 100 · direct task match.
4. If no skill found: acknowledge it, proceed with general capabilities (`npx skills init my-custom-skill` to scaffold).

**Quality reference — top verified skills as of April 2026:**

| Skill | Source | Installs |
|-------|--------|----------|
| find-skills | vercel-labs/skills | 1.2M |
| systematic-debugging | obra/superpowers | 63K |
| verification-before-completion | obra/superpowers | 44K |
| test-driven-development | obra/superpowers | 54K |
| harden | pbakaus/impeccable | 53K |
| audit | pbakaus/impeccable | 71K |
| sequential-thinking | pi-2r/copilot-cli-docker | — |

> `sequential-thinking` note: use only for algorithmic or architectural problems requiring explicit branch exploration (`#st` trigger). Do NOT use for standard audit steps — 2026 reasoning models already perform sequential thinking internally. Forcing it duplicates work and lowers quality (SurePrompts April 2026).

**Required output:**

| Skill | Source (owner/repo) | Installs | Task Match (Y/N) | Security Pass (Y/N) | Action |
|-------|---------------------|----------|------------------|---------------------|--------|
| [name] | [owner/repo] | [count] | [Y/N] | [Y/N] | [Selected / Excluded / Not found] |

| Flags |
|-------|
| [any skill failing criteria, requiring manual setup, or not found — or NONE] |

> **Gate check before proceeding:** I have run the discovery process and produced the loaded skills table and flags table above.

`::STEP1_6_VERIFIED::`

---

## STEP 1.7 — Apply Skills (Single-Task per Skill)
> arXiv:2603.10047 M3 (+80%) · agentskills.io spec. See references/SCIENTIFIC-BASIS.md for full citations.

**How skills actually work** (agentskills.io / Simform Engineering, Apr 2026):
A skill's SKILL.md is injected into context. The agent must then explicitly follow the instructions
in that skill's body. If if the instruction is not quoted and application not shown,
the skill is loaded but unapplied — which is the same as not using it.

**Required output (repeat for each skill):**

| Field | Value |
|-------|-------|
| Skill | [name — e.g. systematic-debugging] |
| Instruction followed | [exact rule or step from that skill's SKILL.md you are applying] |
| Applied to | [specific code location, function, or task element] |
| Result | [concrete finding — not a summary, not a restatement of the instruction] |

> If a skill from Step 1.6 cannot be loaded or its instructions are inaccessible:
> write `SKILL UNAVAILABLE: [skill name] — [reason]` and skip it. Do not fabricate a result.

> **Context anchor** (arXiv:2507.13334 — lost-in-the-middle: up to 73% degradation):
> After all skills, write the top-3 findings here so they stay accessible in later steps.

| Top finding | Source skill | Why it matters for this task |
|-------------|-------------|------------------------------|
| [finding 1] | [skill] | [relevance] |
| [finding 2] | [skill] | [relevance] |
| [finding 3] | [skill] | [relevance] |

> **Gate check before proceeding:** Each skill block has all four fields populated, including
> "Instruction followed" with a real quote or paraphrase from that skill's instructions.
> Listing a skill name with only a generic finding is a violation of this gate.

`::STEP1_7_VERIFIED::`

---

## STEP 2 — Check Online (April 2026)
> **[R3 reminder]** Do NOT invent URLs or dates. Use real tool results only.
> Different agents name their search tool differently. This step is tool-agnostic.
> arXiv:2502.15335 — self-grounding: reference prior step outputs as premises before search.

**TOOL DISCOVERY + DOMAIN RESEARCH — two goals, one query:**

A search capability is available in this environment. It may be named `web_search`, `search`,
`browser`, `tavily`, `perplexity`, `brave_search`, `google`, or something else entirely.

Do not run a generic test query. Instead, use the domain glossary from STEP 0 to build the
first search query. This confirms the tool works **and** produces immediately useful results.

**Query construction rule:**
1. Take 2–3 key terms from the STEP 0 glossary (the most domain-specific ones).
2. Append the current year or "latest" for recency.
3. Run that as the first query. If results return → tool confirmed. Use it for all queries below.
4. If the query fails with a tool-not-found error → write `SEARCH TOOL ERROR: [exact error]`.
5. "I don't have a search tool" is never valid here. Run the query and report what happens.

**Fallback rule:**
If STEP 0 produced "No domain glossary needed", use the generic test query:
`"agent skills best practices 2026"`.

Example (if glossary contains `PageRank`, `Louvain`, `graphology`):
> First query: `graphology PageRank Louvain latest`

**Anti-hallucination rule:**
- Use whatever search tool the environment provides — every time, no exceptions
- Never invent URLs, titles, dates, or sources
- Every result must include: real URL (from tool), publication date, confirmed vs projection
- If tool truly inactive: write `SEARCH NOT EXECUTED: [exact error or reason]`
  and flag `DATA NOT VERIFIABLE LIVE`

**Required output:**

| URL (real, from tool) | Date | Summary | Status |
|-----------------------|------|---------|--------|
| [real URL] | [date] | [summary] | CONFIRMED / PROJECTION |

> **Gate check before proceeding:** The first query was built from STEP 0 glossary terms (not a generic test). Results are real tool output. Wrote SEARCH NOT EXECUTED with exact reason if tool failed.
> **Rule echo [R3]:** Every URL above was returned by the actual search tool. No source invented.

`::STEP2_VERIFIED::`

---

## STEP 3 — Error & Logical Bug Report
> **[R4 reminder]** Identify root cause before any fix. Symptom-only fixes are invalid.
> **[R2 reminder]** Produce both Phase A and Phase B tables even if no issues found.

> arXiv:2603.10047 M4 (+100%) · obra/superpowers:systematic-debugging. See references/SCIENTIFIC-BASIS.md.

**Phase A — Raw Facts** (observable only, no interpretation):

| ID | Fact | Location |
|----|------|----------|
| F1 | [observable fact — no interpretation] | [line / function / module] |

**Phase B — Classified Findings (dual-assessment):**
> Pattern: critique/pbakaus/impeccable (82.9K) — dual-assessment to prevent confirmation bias.

**Assessment A — Static read** (text analysis, no runtime assumptions):
> Use semi-formal reasoning (arXiv:2603.01896): each finding must include Premise → Evidence → Conclusion.
> Evidence = specific code path, line, or token traced. No claim without traced evidence.

| Severity | Issue | Context | Premise | Evidence (traced path) | Conclusion / Root Cause | Fix | Validation |
|----------|-------|---------|---------|------------------------|------------------------|-----|------------|
| CRIT/MED/LOW | [name] | [line/fn] | [what you assume] | [exact code path traced] | [why it fails] | [fix] | [test] |

**Assessment B — Behavioral read** (runtime paths, edge cases, failure modes):
> Same semi-formal requirement: Premise → Evidence → Conclusion per finding.

| Severity | Issue | Context | Premise | Evidence (traced path) | Conclusion / Root Cause | Fix | Validation |
|----------|-------|---------|---------|------------------------|------------------------|-----|------------|
| CRIT/MED/LOW | [name] | [line/fn] | [what you assume] | [exact code path traced] | [why it fails] | [fix] | [test] |

**False-negative guard** (arXiv:2603.00539 — systematic overcorrection check):
Before synthesis, explicitly verify: Am I flagging correct code as broken?

| Finding | Evidence strength | FN risk | Action |
|---------|-----------------|---------|--------|
| [name] | Strong / Ambiguous / Weak | Low / Medium / High | Keep / Downgrade / Drop |

**Synthesis:**

| Issue | A flagged | B flagged | FN risk | Confidence | Action |
|-------|-----------|-----------|---------|------------|--------|
| [name] | Y/N | Y/N | Low/Med/High | High / Review needed | [keep / drop / investigate] |

Severity: `CRITICAL` execution/security/data loss · `MEDIUM` perf/UX/maintainability · `LOW` refactoring/backlog

> **Gate check before proceeding:** I have produced Phase A (raw facts table) and Phase B (classified findings table) separately.
> **Rule echo [R4]:** Every finding in Phase B has a Root Cause field populated. I did not propose any fix without identifying a root cause first.

`::STEP3_VERIFIED::`

---

## STEP 3.5 — Verify & Tasklist

Cross-check findings from code, skills output, and web sources.
Verify every constraint from STEP 1 is addressed.
Resolve conflicts before generating the tasklist.

**Required output:**

| Constraint | Status | Addressed by |
|------------|--------|--------------|
| C1 | Addressed / Not addressed | [task or step] |

| Priority | Task | Effort | Depends on | Acceptance Criterion |
|----------|------|--------|------------|----------------------|
| [P0] | [task name] | [Xh] | [dependency] | [testable criterion] |

Priority scale: `[P0]` <24h · `[P1]` <1 week · `[P2]` <1 month · `[P3]` backlog

> **Gate check before proceeding:** I have produced the constraint coverage table and the prioritized tasklist table above.

`::STEP3_5_VERIFIED::`

---

## STEP 4 — Fix / Snippets
> Format: GSD-compatible XML task structure (gsd-build/get-shit-done, 57K stars)
> Each fix uses a `<task>` block — directly executable by any GSD-compatible agent.
> `<verify>` = exact command to test. `<done>` = observable done condition. Both mandatory.

- Provide commented, testable code with safe fallbacks and error handling
- Propose 2 alternatives with pros, cons, and compatibility notes
- Use `response_format: JSON` when structured output is explicitly requested

**Required output:**

```xml
<task type="auto">
  <n>[Fix name — one line]</n>
  <files>[file path(s) to modify]</files>
  <action>
    [Commented implementation — explain every non-obvious choice inline]
  </action>
  <verify>[Exact command to run to confirm the fix works]</verify>
  <done>[Observable condition that confirms completion — no ambiguity]</done>
</task>
```

| Field | Value |
|-------|-------|
| Test command | [from `<verify>` above] |
| Expected output | [from `<done>` above] |

| | Alternative A | Alternative B |
|-|---------------|---------------|
| Description | [desc] | [desc] |
| Pros | [pros] | [pros] |
| Cons | [cons] | [cons] |
| Compatibility | [compat] | [compat] |

> **Fix-guided Verification Filter** (arXiv:2603.00539 — see references/SCIENTIFIC-BASIS.md):
> Confirm: (1) the fix directly addresses the root cause identified in Phase A (not just the symptom),
> (2) the fix does not introduce new failures, (3) the original code behavior is clearly changed by it.
> If any of these three fails: the fix is invalid — revise before writing the gate token.

> **Gate check before proceeding:** I have produced the `<task>` XML with all five fields (`<n>`, `<files>`, `<action>`, `<verify>`, `<done>`), the test/expected table, and the alternatives table.

`::STEP4_VERIFIED::`

---

## STEP 5 — Self-Verification Cycle (Mandatory)
> **[R1+R2 reminder]** This is the last step. Skipping or shortening it is the most common
> prospective memory failure (arXiv:2303.23530). Produce every table fully.

> arXiv:2505.09031 + arXiv:2510.24476. See references/SCIENTIFIC-BASIS.md.

Steps:
1. Write an initial answer to the original question or task
2. Generate 3–4 verification questions (accuracy · completeness · coherence · security)
3. Answer each, citing logic or sources
4. Cross-consistency check against all prior steps — resolve any conflict explicitly
5. Revise the initial answer — mark every change explicitly

**Required output:**

**Initial answer:** [answer]

| # | Verification Question | Answer + source or logic |
|---|-----------------------|--------------------------|
| Q1 | [question] | [answer] |
| Q2 | [question] | [answer] |
| Q3 | [question] | [answer] |
| Q4 | [question, if needed] | [answer] |

| Cross-consistency check |
|-------------------------|
| [conflicts with prior steps and resolutions, or NONE] |

**Spec self-review** (before writing revised answer):
> Pattern: brainstorming/obra/superpowers (124.2K).

| Check | Status | Notes |
|-------|--------|-------|
| Placeholder scan | Pass / Fail | Any TBD, TODO, or incomplete sections? |
| Internal consistency | Pass / Fail | Do any sections contradict each other? |
| Scope check | Pass / Fail | Is anything over-promised or under-delivered? |
| Ambiguity check | Pass / Fail | Any requirement interpretable two ways? |

**Revised answer — changes:** [summary of what changed]
[revised answer]

> **Gate check — FINAL STEP:** I have produced the initial answer, the verification table, the cross-consistency table, and the revised answer.
> **Rule echo [R1+R2]:** This is the final gate. I have not skipped or shortened any step in this audit. All gate tokens above were written only after their tables were complete.

`::STEP5_VERIFIED::`

---
`::ALL_STEPS_VERIFIED:: — ANALYSIS COMPLETE`
---