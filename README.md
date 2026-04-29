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

## Requisiti
- Node.js >= 18
- git
- Gemini CLI
- (opz.) Kilo Code / Antigravity installati

## 1) Installa GSD (completo)

Aggiorna/installa GSD:
```bash
npx get-shit-done-cc@latest
```

Non-interactive:
```bash
# Gemini CLI (globale)
npx get-shit-done-cc --gemini --global

# Kilo (locale nel progetto)
npx get-shit-done-cc --kilo --local

# Antigravity (locale nel progetto)
npx get-shit-done-cc --antigravity --local
```

(vedi get-shit-done per i path esatti)

## (Consigliato) Crea un piano
Copia `docs/PLAN.template.md` in `docs/PLAN.md` e compilalo.

## 2) Setup Kilo Code (MCP + permission)

Questo script aggiorna **kilo.jsonc** (formato moderno) e genera anche **.kilocode/mcp.json** (legacy/compat).
```bash
node scripts/install-kilo-jsonc.mjs
```

## 3) Setup Antigravity (MCP)
```bash
node scripts/install-antigravity-mcp.mjs
```
Poi reload/restart Antigravity.

## 4) Setup Gemini CLI commands

I comandi sono in `.gemini/commands/council/`.
Dentro Gemini CLI:
```
/commands reload
```

## Workflow consigliato (Plan → Review → Apply)
1) Implementa feature/fix  
2) Staggia: `git add -A`  
3) `/council:review`  
4) `/council:review-apply`  
5) Test finali  
6) Commit  

## skills.sh (opzionale)

### Installare skill pubbliche
```bash
npx skills add vercel-labs/agent-skills
```

No telemetry:
```bash
DISABLE_TELEMETRY=1 npx skills add vercel-labs/agent-skills
```

### Skill locale (repo)
Questo repo include una skill locale (vedi `skills/`).

Install multi-agent:
```bash
npx skills add . --skill code-analysis-audit -a antigravity -a gemini-cli -a kilo -a warp -y
```
