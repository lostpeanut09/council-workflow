# MCP Package Pins

This document explains the current pinned versions of `@modelcontextprotocol/*` npm packages, the rationale behind each pin, and the process for updating them safely.

## Current Pins

| Package | Pinned Version | Pinned Date | Advisory DB |
|---------|---------------|-------------|-------------|
| `@modelcontextprotocol/server-filesystem` | `2025.8.21` | 2026-04-30 | [GLAD](https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/server-filesystem/) |
| `@modelcontextprotocol/server-everything` | `2025.8.18` | 2026-04-30 | [GLAD](https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/) |

## Why These Packages Are Pinned

### Rationale

- **Reproducibility**: `npx @pkg` without version pulls `latest` at runtime. This means two runs on different days can behave differently if the package author pushes a breaking change or a malicious update.
- **Supply chain control**: MCP servers with filesystem or network access are high-risk. A "rug pull" — where a trusted package is silently updated to exfiltrate data — is a realistic threat vector (documented in OWASP GenAI Security, Apr 2026).
- **Advisory monitoring**: The GitLab Advisory Database (GLAD) tracks CVEs for `@modelcontextprotocol/*`. Known issues include path traversal bypasses via symlinks in `server-filesystem`.

### Deprecated packages (never use)

| Package | Status | Replacement |
|---------|--------|------------|
| `@modelcontextprotocol/server-github` | ❌ Deprecated (npm) | `ghcr.io/github/github-mcp-server` (Docker) |
| `@modelcontextprotocol/server-puppeteer` | ❌ Deprecated (npm, "no longer supported") | `mcp/playwright` (Docker/Microsoft official) |

---

## How to Update Pins

### Step 1 — Check latest version and advisories

```bash
# Check latest available versions
node scripts/update-mcp-pins.mjs

# Or manually:
npm view @modelcontextprotocol/server-filesystem version
npm view @modelcontextprotocol/server-everything version
```

Check the advisory DB before bumping:
- https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/server-filesystem/
- https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/server-everything/

### Step 2 — Update the pin in two files

Edit `scripts/install-kilo-jsonc.mjs`:
```js
const MCP_PINS = {
  filesystem: "NEW_VERSION",  // e.g. "2025.9.5"
  everything: "NEW_VERSION"
};
```

Edit `kilo.jsonc` — update the version in the `command` array for each server.

### Step 3 — Regression checklist

Before merging a pin bump PR:

- [ ] Run `node scripts/update-mcp-pins.mjs` — no advisory warnings?
- [ ] Run `node scripts/install-kilo-jsonc.mjs` locally — does it complete without errors?
- [ ] Enable the server temporarily in a local branch and test basic tool call
- [ ] Check the package's `CHANGELOG.md` or GitHub releases for breaking changes
- [ ] CI `mcp-supplychain.yml` passes on the PR

### Step 4 — Open a PR with council review

```bash
git add kilo.jsonc scripts/install-kilo-jsonc.mjs docs/MCP_PINS.md
git commit -m "chore: bump MCP pins [filesystem@X.Y.Z, everything@X.Y.Z]"
# Then: /council:review in Kilo before merging
```

---

## Docker Image Digest Pinning

Docker tags (e.g. `mcp/playwright`) are **mutable** — they can be silently updated to different content. For supply-chain safety, pin images to their immutable `@sha256:...` digest.

### Lock file: `docs/MCP_IMAGE_PINS.lock.json`

Committed into the repo. Contains the immutable digests for each Docker MCP image. Initially has `null` values — populate with the script below.

### Update digests (requires Docker running)

```bash
node scripts/update-mcp-image-pins.mjs
git add docs/MCP_IMAGE_PINS.lock.json
git commit -m "chore: update docker MCP image digest pins"
# Then regenerate kilo.jsonc with pinned refs:
node scripts/install-kilo-jsonc.mjs
```

The installer reads the lock file automatically — if digests are present it uses `@sha256:...` refs; otherwise falls back to tag refs gracefully.

### Verify image signatures (cosign) — for `mcp/*` Verified Publisher images

Docker MCP Catalog images are signed. Verify with cosign:

```bash
COSIGN_REPOSITORY=mcp/signatures \
cosign verify mcp/playwright \
  --key https://raw.githubusercontent.com/docker/keyring/refs/heads/main/public/mcp/latest.pub
```

For `ghcr.io/github/github-mcp-server`, verify the commit label:

```bash
docker image inspect ghcr.io/github/github-mcp-server \
  --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'
# Compare the SHA to the github/github-mcp-server release page
```

### Docker digest bump checklist

Before bumping a Docker image digest:

- [ ] Run `node scripts/update-mcp-image-pins.mjs` (pulls latest and captures digest)
- [ ] For `mcp/*` images: run cosign verify (see above)
- [ ] For `ghcr.io` images: check the revision label against release notes
- [ ] Open PR — council review required (`/council:review`)
- [ ] After merge: run `node scripts/install-kilo-jsonc.mjs` to regenerate `kilo.jsonc`

### When to bump

- New security advisory affecting the image
- New toolset features you need
- Scheduled quarterly review

---

## Version History

| Date | filesystem | everything | Changed by |
|------|-----------|-----------|------------|
| 2026-04-30 | `2025.8.21` | `2025.8.18` | Initial pin (replaced unpinned `@latest`) |
