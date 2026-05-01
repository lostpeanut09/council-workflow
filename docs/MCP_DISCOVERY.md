# MCP Server Discovery Guidelines

To maintain rigorous supply-chain hygiene and avoid executing malicious arbitrary code, the Council Workflow enforces strict guidelines on how new MCP (Model Context Protocol) servers are discovered and integrated.

## 🟢 Preferred: Docker MCP Catalog

Docker provides a curated **MCP Catalog** containing verified, containerized MCP servers. 

**Why it's preferred:**
- Images are cryptographically signed using `cosign` and transparency logs.
- Execution is containerized (sandbox isolation).
- Digest pinning is straightforward and enforceable.

**Workflow:**
When discovering a new tool, check if it exists in the Docker MCP Catalog first. Reference it exclusively by its `sha256` digest in `kilo.jsonc` (e.g., `mcp/playwright@sha256:...`).

## 🟢 Preferred: Official mcpservers.org

The website [mcpservers.org](https://mcpservers.org) maintains an **Official** list of MCP servers (e.g., GitHub, Supabase, Exa, E2B). 

**Workflow:**
If a tool is not in the Docker catalog, prefer the Official tier on `mcpservers.org`. Always verify the underlying repository and pin the installation to a specific version or commit hash, rather than relying on floating tags like `latest`.

## 🔴 Avoid: Unverified Community Repositories

Do **not** integrate random, community-built MCP servers or `npx` execution paths without performing a thorough codebase audit. 

**Why it's dangerous:**
- `npx` packages can be hijacked or updated with malicious code.
- Unverified containers have no provenance or signatures.
- An MCP server runs on your local machine and can access your filesystem, network, and environment variables.

**Workflow:**
If a community MCP is absolutely necessary, fork the code, review it, build the image internally, and pin the digest.
