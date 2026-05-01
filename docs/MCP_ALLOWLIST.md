# MCP Server Allowlist and Governance

This document establishes the configurations, restrictions, and explicit guidelines for consuming Model Context Protocol (MCP) servers within the Council Workflow, adhering to the principle of **Least Privilege**.

## GitHub MCP Server Configuration

The official GitHub MCP server (`ghcr.io/github/github-mcp-server`) supports granular access control. We enforce the following standard profiles based on the required task:

### 1. Default (Base Review)
For general reading and repository context, expose only what is strictly necessary.
```bash
GITHUB_TOOLSETS=default
```
*(By default, this usually includes `context`, `repos`, `issues`, `pull_requests`, `users`).*

### 2. Deep Review & Management
For deeper interactions involving actions and code security scanning.
```bash
GITHUB_TOOLSETS=default,actions,code_security
```

### 3. Strict Read-Only Mode
Regardless of the `GITHUB_TOOLSETS` defined, we enforce read-only execution to prevent agents from inadvertently pushing code, merging PRs, or modifying issues unless strictly running an execution branch.
```bash
# Prevents any write/update/delete operation
GITHUB_READ_ONLY=1
```
*Note: A read-only mode makes the GitHub MCP a "safe by construction" tool.*

## Optional Recipe: Remote OAuth MCP Servers

If your workflow requires integrating remote hosted MCP servers (e.g., enterprise services) that mandate OAuth authentication, but your CLI agent (like Gemini or Kilo) only natively handles `stdio`, you can bridge them using `mcp-remote`.

1. Install `mcp-remote` globally or locally.
2. In your `kilo.jsonc` (or equivalent configuration), define the server as a local command that uses `mcp-remote` to proxy to the remote URL:
```json
{
  "mcp": {
    "enterprise-oauth": {
      "type": "local",
      "command": [
        "npx",
        "mcp-remote",
        "https://mcp.enterprise.internal"
      ],
      "enabled": true
    }
  }
}
```
*This allows standard stdio clients to interface seamlessly with remote OAuth-gated MCP environments.*
