# MCP Server Allowlist

> Policy: ogni server MCP usato in questo progetto deve essere documentato qui.
> Aggiorna questa lista prima di abilitare nuovi server in `kilo.jsonc`.
> Se cambia lo schema dei tool, richiede re-review (update hash_check).

## Server attivi

### kilo-reviewer (LOCAL — STDIO)
| Campo | Valore |
|-------|--------|
| **Tipo** | `local` / STDIO |
| **Command** | `node mcp/server.mjs` |
| **REPO_PATH** | `.` (relativo) |
| **Risk level** | LOW |
| **Toolset** | `review_code`, `review_diff` |
| **Enabled** | `true` |
| **Motivazione** | Council peer-review automatico su staged diff e PR |
| **Source** | Interno al repo — `mcp/server.mjs` |

### context7 (REMOTE — Streamable HTTP)
| Campo | Valore |
|-------|--------|
| **Tipo** | `remote` |
| **URL** | `https://mcp.context7.com/mcp` |
| **Risk level** | LOW |
| **Toolset** | Documentation lookup |
| **Enabled** | `true` |
| **Motivazione** | Accesso a documentazione librerie up-to-date |
| **Auth** | None (public read-only) |
| **Note** | Preferire endpoint `/mcp` (Streamable HTTP, apr 2026) |

---

## Server disabilitati (off by default)

### mcp_everything (LOCAL)
| Campo | Valore |
|-------|--------|
| **Enabled** | `false` |
| **Risk level** | HIGH |
| **Motivazione disabilitazione** | Tool generico ad ampio scope — abilita solo in dev locale con supervisione |

### puppeteer (LOCAL)
| Campo | Valore |
|-------|--------|
| **Enabled** | `false` |
| **Risk level** | HIGH |
| **Motivazione disabilitazione** | Browser automation — potenziale exfiltration, abilita solo quando necessario |

### filesystem (LOCAL)
| Campo | Valore |
|-------|--------|
| **Enabled** | `false` |
| **Risk level** | HIGH |
| **Motivazione disabilitazione** | Accesso file system illimitato — abilita solo con path scope esplicito |

---

## Policy operative (Aprile 2026)

### Trasporti
- **Locale**: sempre STDIO (`type: local`, `command: [...]`)
- **Remoto nuovo**: preferire Streamable HTTP (endpoint `/mcp`)
- **SSE**: solo per backward-compat con server legacy; deprecato da spec MCP 2025-03-26

### Least privilege
- Partire con toolset minimi (read-only se possibile)
- Abilitare toolset "write" solo quando il workflow lo richiede
- `filesystem`, `puppeteer`, `mcp_everything`: `enabled: false` di default — sempre

### Supply chain
- Per server via `npx`: **pinnare la versione** (`@pkg@x.y.z`) per riproducibilità
- Verificare advisory su Snyk/GitHub per pacchetti `@modelcontextprotocol/*`
- Preferire server "official" (es. GitHub official MCP) rispetto a terze parti

### OAuth (per server remoti con auth)
- Nessun token in repo — solo via env/secrets manager
- Usare **Resource Indicators** (RFC 8707) per isolare token per server
- Validare audience/risorsa lato server a ogni request

### Tool definition change control (anti "rug pull")
- Se un server remoto cambia definizione dei tool → richiede re-review manuale
- Aggiornare questa allowlist con il nuovo toolset e motivazione

---

## Come aggiungere un nuovo server

1. Identificare su `mcpservers.org` o repository ufficiale
2. Verificare: Official/trusted source? Toolset minimale? Tipo di auth?
3. Aggiungere entry in questa tabella con risk level e motivazione
4. Aggiungere entry in `kilo.jsonc` con `enabled: false` inizialmente
5. Testare in locale, poi cambiare a `enabled: true` se OK
6. Aprire PR con review del council (`/council:review`)
