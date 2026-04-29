# council-workflow

**Nota portabilità:** non committare path assoluti in `kilo.jsonc`. Questo repo usa path relativi.

Council workflow = **Gemini (coder)** + **Kilo Gateway free (reviewer)** + guardrails.

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

(vedi get-shit-done for i path esatti)

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
