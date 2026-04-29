# council-workflow

**Nota portabilità:** non committare path assoluti in `kilo.jsonc`. Questo repo usa path relativi.

Council workflow = **Gemini (coder)** + **Kilo Gateway free (reviewer)** + guardrails.

---

## Audit Compliance v16.0

Questo repository è conforme agli standard di code review v16.0 (Aprile 2026).

| Standard | Conformità | Verifica |
|----------|------------|----------|
| **Code Analysis Skill v16.0** | ✅ | [`skills/code-analysis-audit/SKILL.md`](skills/code-analysis-audit/SKILL.md) contiene tutti i gate `::STEP0_VERIFIED::` - `::STEP5_VERIFIED::` |
| **Path relativi (Zero absolute paths)** | ✅ | `kilo.jsonc` e `.kilocode/mcp.json` usano percorsi relativi; niente `C:\` nei file tracciati |
| **Clean repo / No runtime artifacts** | ✅ | `.gitignore` esclude `docs/PLAN.md`, `docs/REVIEW_KILO.md` e i backup (`*.bak-*`) |
| **Line endings normalizzati** | ✅ | `.gitattributes` forza LF per i file di configurazione |

**Ultima verifica:** 2026-04-30  
**Commit di conformità:** [`9053503`](https://github.com/lostpeanut09/council-workflow/commit/9053503)  

---

## Abstract

Il framework *council-workflow* implementa un processo collaborativo di sviluppo software basato su revisione multi-agente, ispirato alle best practice di *Model Context Protocol* (MCP) e alle metodologie di *Systematic Code Review* (arXiv:2603.10047, 2026). L'architettura integra agenti specializzati (Gemini per la generazione, Kilo Gateway per la revisione, Antigravity per l'orchestrazione) attraverso un protocollo standardizzato che garantisce portabilità, sicurezza e tracciabilità delle decisioni.

Il workflow segue un ciclo **Plan → Review → Apply** strutturato in fasi documentate, con validazione formale degli artefatti (commit, PR, test) e audit automatico tramite la *Code Analysis Skill* v16.0.

---

## 1. Introduzione

### 1.1. Architettura e Componenti

Il sistema si compone dei seguenti moduli principali:

- **Gemini CLI** (coder): agente di generazione codice con accesso a filesystem locale e contesto del progetto.
- **Kilo Gateway** (reviewer): server MCP locale (`mcp/server.mjs`) che invia i diff al Kilo Gateway (modello `kilo-auto/free`) per revisione automatica.
- **Antigravity MCP**: orchestratore di tool e servizi esterni (deprecato SSE, preferito Streamable HTTP secondo spec MCP 2025‑03‑26).
- **Skill di audit** (`code-analysis-audit`): implementa il framework di revisione sistematica v16.0 (dominio, analisi, verifica, correzione).

### 1.2. Flusso di Lavoro

1. **Plan**: Creazione di `docs/PLAN.md` a partire da `PLAN.template.md`.
2. **Implement**: Sviluppo locale (Gemini CLI) con `git add -A`.
3. **Review**: Invocazione `/council:review` (Kilo Gateway analizza il diff e produce report strutturato).
4. **Apply**: Applicazione selettiva delle correzioni (`/council:review-apply`).
5. **Test**: Esecuzione della suite di test.
6. **Commit**: Finalizzazione con messaggio descrittivo.

---

## Requisiti

- **Node.js** >= 18
- **git**
- **Gemini CLI**
- (Opzionale) Kilo Code / Antigravity installati

---

## 2. Configurazione Iniziale

### 2.1. Installazione GSD (Get Shit Done)

Aggiornamento/installazione framework GSD:

```bash
npx get-shit-done-cc@latest
```

Modalità non-interattiva:

```bash
# Gemini CLI (globale)
npx get-shit-done-cc --gemini --global

# Kilo (locale nel progetto)
npx get-shit-done-cc --kilo --local

# Antigravity (locale nel progetto)
npx get-shit-done-cc --antigravity --local
```

### 2.2. Piano di Sviluppo (Opzionale)

Copia il template:

```bash
cp docs/PLAN.template.md docs/PLAN.md
```

Compila `docs/PLAN.md` con milestone, dipendenze e criteri di accettazione.

---

## 3. Setup Infrastruttura MCP

### 3.1. Kilo Code Review (Locale)

Il seguente script aggiorna `kilo.jsonc` (formato moderno) e genera `.kilocode/mcp.json` (compatibilità legacy):

```bash
node scripts/install-kilo-jsonc.mjs
```

**Specifiche di configurazione** (MCP 2025‑03‑26):
- Transport: STDIO (locale) per `kilo-reviewer`.
- Remote: Streamable HTTP (deprecato SSE).
- Path relativi: `"./mcp/server.mjs"`, `REPO_PATH: "."`.
- Timeout: 10 s.

### 3.2. Antigravity MCP

```bash
node scripts/install-antigravity-mcp.mjs
```

Ricarica/restart Antigravity dopo l'installazione.

### 3.3. Comandi Gemini CLI

I comandi risiedono in `.gemini/commands/council/`. All'interno di Gemini CLI:

```
/commands reload
```

---

## 4. Workflow Operativo

1. **Implementa** feature/fix.
2. **Staggia**: `git add -A`
3. **Review**: `/council:review`
4. **Apply**: `/council:review-apply`
5. **Test finali**
6. **Commit**

---

## 5. Estensioni e Tooling

### 5.1. MCP Best Practices (Aprile 2026)

L'architettura segue le *12 regole per deployment production* (Apigene, 2026):

- **Zero path assoluti** nei file di configurazione.
- **Gateway pattern** consigliato per >3 server MCP (non applicato qui: singolo server locale).
- **Struttura tool**: descrizioni precise, validazione input/output, gestione errori.
- **Credential isolation**: environment variables, niente secret in `kilo.jsonc`.

### 5.2. skills.sh (Opzionale)

Installa skill pubbliche:

```bash
npx skills add vercel-labs/agent-skills
```

Disabilita telemetria:

```bash
DISABLE_TELEMETRY=1 npx skills add vercel-labs/agent-skills
```

### 5.3. Skill Locale

Il repo include la skill `code-analysis-audit`. Installa multi-agent:

```bash
npx skills add . --skill code-analysis-audit -a antigravity -a gemini-cli -a kilo -a warp -y
```

---

## 6. Audit e Conformità

La *Code Analysis Skill* v16.0 implementa un processo formale di revisione (arXiv:2603.10047):

1. **STEP 0**: Glossario di dominio.
2. **STEP 1**: Analisi requisiti e success criteria.
3. **STEP 1.5–1.7**: Selezione e applicazione skill.
4. **STEP 2**: Verifica online (fonti live).
5. **STEP 3**: Dual-assessment (statico + dinamico) con root cause.
6. **STEP 4**: Fix GSD-compatibili.
7. **STEP 5**: Self-verification.

Ogni step produce artefatti verificabili (tabelle, trace) e termina con un *gate token* (`::STEPn_VERIFIED::`).

---

## 7. Riferimenti

- MCP Specification 2025‑03‑26, Model Context Protocol Working Group.
- Kilo Gateway Documentation, Kilo.ai (2026).
- arXiv:2603.10047 — *Systematic Code Review Frameworks*, 2026.
- Apigene Blog — *MCP Best Practices: 12 Rules for Production*, 2026-03-26.
- ChatForest — *MCP Tool Composition*, 2026-03-28.
- PapersFlow — *Gemini CLI MCP Setup for Academic Research*, 2026-03-12.

---

## 8. Licenza

MIT – vedi file `LICENSE` (se presente) o repository sorgente.

