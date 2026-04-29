# council-workflow

Council workflow = Gemini (coder) + Kilo Gateway free (reviewer) + guardrails.

*This repository implements a portable, production-grade agentic review workflow.*

## Requisiti
- Node.js >= 18
- git
- Gemini CLI installato

## Setup (una volta sola)

### 1) Installa GSD (completo)
# Gemini CLI (globale)
npx get-shit-done-cc --gemini --global

# Kilo (locale nel progetto)
# Nota: Kilo usa kilo.jsonc in root per evitare conflitti con GSD
npx get-shit-done-cc --kilo --local

# Antigravity (locale nel progetto) -> installa in ./.agent/
npx get-shit-done-cc --antigravity --local

(vedi get-shit-done for i path esatti)

### 2) Installa MCP
# Antigravity
node scripts/install-antigravity-mcp.mjs

# Kilo Code
node scripts/install-kilo-mcp.mjs

### 3) Ricarica comandi Gemini CLI
Apri Gemini CLI nella root del repo e fai:
  /commands reload

## Workflow (Plan → Review → Apply)
1) Implementa feature/fix
2) Staggia: git add -A
3) /council:review  (scrive docs/REVIEW_KILO.md)
4) /council:review-apply (applica solo High/Medium + test)
5) Commit

Nota: un hook blocca git commit/push se manca docs/REVIEW_KILO.md.
