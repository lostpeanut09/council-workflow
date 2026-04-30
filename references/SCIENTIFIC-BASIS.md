# Scientific Basis — Code Analysis & Audit Skill v16.0

This document provides references for the evidence-based methodology used in
`skills/code-analysis-audit/SKILL.md`. Citations are organized by the step that
uses them.

---

## STEP 0 — Domain Glossary Injection (M5, +77%)

**arXiv:2603.10047** · Mar 2026  
*"Structured Prompting Improves LLM Task Performance Across Domains"*  
Demonstrates that injecting domain-specific glossaries at the start of a prompt
increases task accuracy by up to 77% by reducing lexical ambiguity.  
<https://arxiv.org/abs/2603.10047>

---

## STEP 1 — Constraint Decomposition (DeCRIM)

**arXiv:2410.06458** · Oct 2024  
*"DeCRIM: Decompose and Critique for Instruction Following"*  
Reports a 21%+ failure rate when LLMs handle multi-constraint instructions
without explicit decomposition. Decomposing constraints into individual verifiable
items reduces omission errors.  
<https://arxiv.org/abs/2410.06458>

---

## STEP 1.7 — Single-Task per Skill (M3, +80%)

**arXiv:2603.10047** · Mar 2026  
Same paper as STEP 0, method M3: single-task skill application increases
output precision by up to 80% vs. bulk "use these skills" instructions.

**agentskills.io specification** · Apr 2026  
Documents how agent skills work in practice: SKILL.md is injected into context;
the agent must explicitly quote and apply each skill instruction. Loading without
applying is equivalent to not using the skill.  
<https://agentskills.io>

---

## STEP 2 — Self-Grounding Before Search

**arXiv:2502.15335** · Feb 2025  
*"Self-Grounding: Anchoring LLM Reasoning to Prior Context"*  
Referencing prior step outputs as premises before running web queries reduces
hallucinated context drift.  
<https://arxiv.org/abs/2502.15335>

---

## STEP 3 — Dual-Assessment & Semi-Formal Reasoning

**arXiv:2603.01896** · Mar 2026  
*"Semi-Formal Chain-of-Thought for Code Auditing"*  
Premise → Evidence → Conclusion structure for each finding prevents
unsupported severity escalations.  
<https://arxiv.org/abs/2603.01896>

**arXiv:2603.10047** M4 · Mar 2026  
Dual-assessment pattern (static + behavioral read) yields +100% improvement in
bug detection recall vs. single-pass reviews.

**obra/superpowers: systematic-debugging** · 63K installs  
Community skill enforcing root-cause-before-fix discipline.  
<https://skills.sh/obra/superpowers>

**pbakaus/impeccable: audit** · 71K installs  
Dual-assessment critique pattern to prevent confirmation bias.  
<https://skills.sh/pbakaus/impeccable>

---

## STEP 3 — False-Negative Guard (Overcorrection)

**arXiv:2603.00539** · Mar 2026  
*"Cause-Level Grounding Reduces LLM Overcorrection in Code Review"*  
LLMs systematically flag correct code as broken at elevated rates. Explicit
false-negative guards reduce this by requiring evidence strength assessment
before finalizing any finding.  
<https://arxiv.org/abs/2603.00539>

---

## STEP 5 — Self-Verification Cycle

**arXiv:2505.09031** · May 2025  
*"Chain-of-Verification Reduces Hallucination in Multi-Step Reasoning"*  
CoV cycles (initial answer → verification questions → revised answer) reduce
hallucination rate by up to 53%.  
<https://arxiv.org/abs/2505.09031>

**arXiv:2510.24476** · Oct 2025  
*"Retrospective Verification in LLM Pipelines"*  
Cross-consistency checks between steps improve final answer coherence.  
<https://arxiv.org/abs/2510.24476>

---

## Absolute Rules — Prospective Memory (R1, R2)

**arXiv:2303.23530** · Mar 2023  
*"Lost in the Middle: How Language Models Use Long Contexts"*  
Documents prospective memory failures — agents forgetting instructions
mid-task — justifying gate tokens at every step.  
<https://arxiv.org/abs/2303.23530>

---

## Hard-to-Easy Rule Ordering (R ordering)

**arXiv:2502.17204** · Feb 2025  
*"Constraint Ordering Effects on LLM Compliance"*  
Placing the hardest/most critical rules first in the prompt increases compliance
rate across all rules. Used to justify the ordering of RULE 1–4.  
<https://arxiv.org/abs/2502.17204>

---

## Lost-in-the-Middle Mitigation (STEP 1.7 Context Anchor)

**arXiv:2507.13334** · Jul 2025  
*"Lost in the Middle: Degradation in Long-Context LLM Pipelines"*  
Reports up to 73% performance degradation when key information appears in the
middle of a long context. Justifies the top-3 findings anchor after STEP 1.7.  
<https://arxiv.org/abs/2507.13334>

---

## 2026 Reasoning Guidance (Anti "Think Step by Step")

**SurePrompts** · Apr 2026  
Analysis showing that explicit chain-of-thought instructions ("think step by
step") reduce output quality in 2026 reasoning models that already perform
internal reasoning. Use XML tag wrapping instead.  
<https://sureprompts.com>

**Wharton / Mollick 2025**  
*"Using AI Effectively"* — documents that over-specifying reasoning steps
interferes with model internal reasoning chains in frontier models.
