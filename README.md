# council-workflow

Council workflow = Gemini (coder) + Kilo Gateway free (reviewer) + guardrails.

## Requisiti
- Node.js >= 18
- git
- Gemini CLI
- (opz.) Kilo Code / Antigravity installati

## 1) Installa GSD (completo)
Aggiorna/installa GSD:
  npx get-shit-done-cc@latest

Non-interactive:
  # Gemini CLI (globale)
  npx get-shit-done-cc --gemini --global

  # Kilo (locale nel progetto)
  npx get-shit-done-cc --kilo --local

  # Antigravity (locale nel progetto)
  npx get-shit-done-cc --antigravity --local

(vedi get-shit-done for i path esatti)

## 2) Setup Kilo Code (MCP + permission)
  node scripts/install-kilo-jsonc.mjs

## 3) Setup Antigravity (MCP)
  node scripts/install-antigravity-mcp.mjs

Poi reload/restart Antigravity.

## 4) Setup Gemini CLI commands
I comandi sono in .gemini/commands/council/
Dentro Gemini CLI:
  /commands reload

## Workflow consigliato (Plan → Review → Apply)
1) Implementa feature/fix
2) Staggia: git add -A
3) /council:review
4) /council:review-apply
5) Test finali
6) Commit

## skills.sh (opzionale)
Install:
  npx skills add vercel-labs/agent-skills

No telemetry:
  DISABLE_TELEMETRY=1 npx skills add vercel-labs/agent-skills
