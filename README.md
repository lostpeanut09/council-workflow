# council-workflow

**Portability Note:** Do not commit absolute paths in `kilo.jsonc`. This repository uses relative paths exclusively.

Council workflow = **Gemini (coder)** + **Kilo Gateway free (reviewer)** + guardrails.

---

## Audit Compliance v16.0

This repository complies with code review standards v16.0 (April 2026).

| Standard | Compliance | Verification |
|----------|------------|--------------|
| **Code Analysis Skill v16.0** | ✅ | [`skills/code-analysis-audit/SKILL.md`](skills/code-analysis-audit/SKILL.md) contains all gates `::STEP0_VERIFIED::` - `::STEP5_VERIFIED::` |
| **Relative Paths (Zero absolute paths)** | ✅ | `kilo.jsonc` and `.kilocode/mcp.json` use relative paths; no `C:\\` in tracked files |
| **Clean Repo / No Runtime Artifacts** | ✅ | `.gitignore` excludes `docs/PLAN.md`, `docs/REVIEW_KILO.md` and backups (`*.bak-*`) |
| **Normalized Line Endings** | ✅ | `.gitattributes` enforces LF for configuration files |

**Last Verification:** 2026-04-30  
**Compliance Commit:** [`9053503`](https://github.com/lostpeanut09/council-workflow/commit/9053503)

---

## Abstract

The *council-workflow* framework implements a collaborative software development process based on multi-agent review, inspired by *Model Context Protocol* (MCP) best practices and *Systematic Code Review* methodologies (arXiv:2603.10047, 2026). The architecture integrates specialized agents (Gemini for generation, Kilo Gateway for review, Antigravity for orchestration) through a standardized protocol that ensures portability, security, and decision traceability.

The workflow follows a structured **Plan → Review → Apply** cycle with formal artifact validation (commits, PRs, tests) and automated audit via the *Code Analysis Skill* v16.0.

---

## 1. Introduction

### 1.1. Architecture and Components

The system comprises the following main modules:

- **Gemini CLI** (coder): Code generation agent with local filesystem access and project context.
- **Kilo Gateway** (reviewer): Local MCP server (`mcp/server.mjs`) submitting diffs to Kilo Gateway (model `kilo-auto/free`) for automated review.
- **Antigravity MCP**: Orchestrator for external tools and services (deprecated SSE, Streamable HTTP preferred per MCP spec 2025‑03‑26).
- **Audit Skill** (`code-analysis-audit`): Implements systematic review framework v16.0 (domain, analysis, verification, correction).

### 1.2. Workflow

1. **Plan**: Create `docs/PLAN.md` from `PLAN.template.md`.
2. **Implement**: Local development (Gemini CLI) with `git add -A`.
3. **Review**: Invoke `/council:review` (Kilo Gateway analyzes diff and produces structured report).
4. **Apply**: Selective correction application (`/council:review-apply`).
5. **Test**: Execute test suite.
6. **Commit**: Finalize with descriptive message.

---

## 2. Prerequisites

- **Node.js** >= 18
- **git**
- **Gemini CLI**
- (Optional) Kilo Code / Antigravity installed

---

## 3. Initial Setup

### 3.1. Install GSD (Get Shit Done)

Update/install GSD framework:

```bash
npx get-shit-done-cc@latest
```

Non-interactive mode:

```bash
# Gemini CLI (global)
npx get-shit-done-cc --gemini --global

# Kilo (local to project)
npx get-shit-done-cc --kilo --local

# Antigravity (local to project)
npx get-shit-done-cc --antigravity --local
```

### 3.2. Development Plan (Optional)

Copy the template:

```bash
cp docs/PLAN.template.md docs/PLAN.md
```

Complete `docs/PLAN.md` with milestones, dependencies, and acceptance criteria.

---

## 4. MCP Infrastructure Setup

### 4.1. Kilo Code Review (Local)

This script updates `kilo.jsonc` (modern format) and generates `.kilocode/mcp.json` (legacy compatibility):

```bash
node scripts/install-kilo-jsonc.mjs
```

**Configuration Specifications** (MCP 2025‑03‑26):
- Transport: STDIO (local) for `kilo-reviewer`.
- Remote: Streamable HTTP (SSE deprecated).
- Relative paths: `"./mcp/server.mjs"`, `REPO_PATH: "."`.
- Timeout: 10 s.

### 4.2. Antigravity MCP

```bash
node scripts/install-antigravity-mcp.mjs
```

Reload/restart Antigravity after installation.

### 4.3. Gemini CLI Commands

Commands reside in `.gemini/commands/council/`. Within Gemini CLI:

```
/commands reload
```

---

## 5. Operational Workflow

1. **Implement** feature/fix.
2. **Stage**: `git add -A`
3. **Review**: `/council:review`
4. **Apply**: `/council:review-apply`
5. **Final Testing**
6. **Commit**

---

## 6. Extensions and Tooling

### 6.1. MCP Best Practices (April 2026)

The architecture follows the *12 Production Deployment Rules* (Apigene, 2026):

- **Zero absolute paths** in configuration files.
- **Gateway pattern** recommended for >3 MCP servers (not applied here: single local server).
- **Tool structure**: Precise descriptions, input/output validation, error handling.
- **Credential isolation**: Environment variables; no secrets in `kilo.jsonc`.

### 6.2. skills.sh (Optional)

Install public skills:

```bash
npx skills add vercel-labs/agent-skills
```

Disable telemetry:

```bash
DISABLE_TELEMETRY=1 npx skills add vercel-labs/agent-skills
```

### 6.3. Local Skill

The repository includes the `code-analysis-audit` skill. Install multi-agent:

```bash
npx skills add . --skill code-analysis-audit -a antigravity -a gemini-cli -a kilo -a warp -y
```

---

## 7. Audit and Compliance

The *Code Analysis Skill* v16.0 implements a formal review process (arXiv:2603.10047):

1. **STEP 0**: Domain glossary injection.
2. **STEP 1**: Task analysis and success criteria.
3. **STEP 1.5–1.7**: Skill selection and application.
4. **STEP 2**: Online verification (live sources).
5. **STEP 3**: Dual-assessment (static + dynamic) with root cause analysis.
6. **STEP 4**: GSD-compatible fixes.
7. **STEP 5**: Self-verification cycle.

Each step produces verifiable artifacts (tables, traces) and terminates with a *gate token* (`::STEPn_VERIFIED::`).

---

## 8. References

- MCP Specification 2025‑03‑26, Model Context Protocol Working Group.
- Kilo Gateway Documentation, Kilo.ai (2026).
- arXiv:2603.10047 — *Systematic Code Review Frameworks*, 2026.
- Apigene Blog — *MCP Best Practices: 12 Rules for Production*, 2026-03-26.
- ChatForest — *MCP Tool Composition*, 2026-03-28.
- PapersFlow — *Gemini CLI MCP Setup for Academic Research*, 2026-03-12.

---

## 9. License

MIT – see `LICENSE` file or repository source.

