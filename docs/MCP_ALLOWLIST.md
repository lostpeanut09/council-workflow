# MCP Server Allowlist

> **Policy**: ogni server MCP usato in questo progetto deve essere documentato qui.
> Aggiorna questa lista PRIMA di abilitare nuovi server in `kilo.jsonc`.
> Se cambia lo schema dei tool o la versione: richiede re-review (council PR).

---

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
| **Source** | Interno al repo — `mcp/server.mjs` |
| **Motivazione** | Council peer-review automatico su staged diff e PR |

### context7 (REMOTE — Streamable HTTP)
| Campo | Valore |
|-------|--------|
| **Tipo** | `remote` — Streamable HTTP (spec 2025-03-26) |
| **URL** | `https://mcp.context7.com/mcp` |
| **Risk level** | LOW |
| **Toolset** | Documentation lookup (read-only) |
| **Enabled** | `true` |
| **Auth** | None (public read-only) |
| **Motivazione** | Accesso a documentazione librerie up-to-date |

---

## Server disabilitati (off by default — least privilege)

### mcp_everything — pinned `@2025.8.18`
| Campo | Valore |
|-------|--------|
| **Package** | `@modelcontextprotocol/server-everything@2025.8.18` |
| **Risk level** | HIGH |
| **Enabled** | `false` |
| **Motivazione disabilitazione** | Tool generico ad ampio scope — abilita solo in dev locale con supervisione |
| **Advisory check** | https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/server-everything/ |

### filesystem — pinned `@2025.8.21`
| Campo | Valore |
|-------|--------|
| **Package** | `@modelcontextprotocol/server-filesystem@2025.8.21` |
| **Risk level** | HIGH |
| **Enabled** | `false` |
| **Note** | Passare directory allowed come argomenti quando si abilita (es. `"."`) |
| **Motivazione disabilitazione** | Accesso file system — abilita solo con path scope esplicito |
| **Advisory check** | https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/server-filesystem/ |

### github — official Docker (`ghcr.io/github/github-mcp-server`)
| Campo | Valore |
|-------|--------|
| **Image** | `ghcr.io/github/github-mcp-server` (GitHub official) |
| **Risk level** | MEDIUM |
| **Enabled** | `false` |
| **Toolsets** | `default` (start minimal — non usare `all`) |
| **Requires** | Docker running + `GITHUB_PAT` env var |
| **Auth** | `GITHUB_PERSONAL_ACCESS_TOKEN` via env (mai in repo) |
| **Sostituisce** | `@modelcontextprotocol/server-github` (npm deprecated) |
| **Motivazione disabilitazione** | Accesso API GitHub — abilitare solo per workflow specifici |
| **Source** | https://github.com/github/github-mcp-server |

### playwright — official Docker (`mcp/playwright`)
| Campo | Valore |
|-------|--------|
| **Image** | `mcp/playwright` (Microsoft — Docker Hub MCP Catalog) |
| **Risk level** | HIGH |
| **Enabled** | `false` |
| **Requires** | Docker running |
| **Sostituisce** | `@modelcontextprotocol/server-puppeteer` (npm deprecated) |
| **Motivazione disabilitazione** | Browser automation — potenziale exfiltration, abilita solo quando necessario |
| **Source** | https://hub.docker.com/mcp/server/playwright |

---

## Policy operative (Aprile 2026)

### Trasporti
| Scenario | Protocollo | Note |
|----------|-----------|------|
| Server locale | **STDIO** | stdout solo JSON-RPC, log su stderr |
| Server remoto nuovo | **Streamable HTTP** (`/mcp` endpoint GET+POST) | Standard spec 2025-03-26 |
| Server remoto legacy | **HTTP+SSE** (fallback) | Deprecato, solo back-compat |

### Least privilege
- Abilitare **solo i toolset necessari** (specie su GitHub MCP: usare `default` non `all`)
- Tool potenti (`filesystem`, `playwright`, `github`) restano `enabled: false` di default
- Abilitare temporaneamente su branch dev, non su `main`

### Versioning e supply chain
- Tutti i pacchetti `@modelcontextprotocol/*` devono essere **pinnati a `@x.y.z`** esatto
- Niente `@latest`, niente `npx pkg` senza versione (violazione CI `repo-hygiene.yml`)
- Controllare advisory prima di bumping: https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/
- Usare `node scripts/update-mcp-pins.mjs` per proposta di aggiornamento (read-only)
- Per Docker: usare SHA image digest in produzione (es. `ghcr.io/github/github-mcp-server@sha256:...`)

### OAuth e token (server remoti con auth)
- Token **mai in repo** — solo via env (`{env:VARNAME}`) o secrets manager
- Usare **Resource Indicators** (RFC 8707): token per server A non devono funzionare su server B
- Validare audience/risorsa lato server a ogni request

### Tool definition change control (anti "rug pull")
- Aggiornare questa allowlist se cambia toolset, versione o source di un server
- Qualsiasi modifica a server abilitati richiede PR con council review (`/council:review`)
- Per server remoti: monitorare changelog del vendor per tool definition changes

---

## Come aggiungere un nuovo server (checklist)

- [ ] Verificare su `mcpservers.org` o repo ufficiale — preferire **Official**
- [ ] Verificare: tipo di auth, toolset esposto, risk level
- [ ] Aggiungere entry in questa tabella con risk level e motivazione
- [ ] Aggiungere in `kilo.jsonc` con `enabled: false` e versione **pinnata**
- [ ] Testare in locale su branch dev
- [ ] Aprire PR — council review obbligatorio (`/council:review`)
- [ ] Cambiare a `enabled: true` solo dopo merge approvato
