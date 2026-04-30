#!/usr/bin/env node

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

function stamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
}

function backupDir(repoRoot) {
  return path.join(repoRoot, ".backups");
}

async function readJsonOr(defaultValue, filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return defaultValue;
  }
}

async function writeJsonWithBackup(repoRoot, filePath, json) {
  const existed = fssync.existsSync(filePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  if (existed) {
    const bdir = backupDir(repoRoot);
    await fs.mkdir(bdir, { recursive: true });
    const base = path.basename(filePath).replaceAll(path.sep, "_");
    const backup = path.join(bdir, `${base}.bak-${stamp()}.json`);
    await fs.copyFile(filePath, backup);
    console.log(`Backup: ${backup}`);
  }
  await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf8");
  console.log(`Updated: ${filePath}`);
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const serverAbs = path.join(repoRoot, "mcp", "server.mjs");
const serverRel = "mcp/server.mjs";

// Pinned npm versions — update deliberately, not via @latest drift
// Check advisories before bumping: https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/
const MCP_PINS = {
  filesystem: "2025.8.21",
  everything: "2025.8.18"
};

if (!fssync.existsSync(serverAbs)) {
  console.error(`ERROR: MCP server not found: ${serverAbs}`);
  process.exit(1);
}

// -----------------------------
// Modern config: kilo.jsonc
// -----------------------------
const kiloPath = path.join(repoRoot, "kilo.jsonc");
const cfg = await readJsonOr({}, kiloPath);

cfg.mcp ||= {};
cfg.permission ||= {};

cfg.mcp["kilo-reviewer"] = {
  type: "local",
  command: ["node", serverRel],
  environment: {
    REPO_PATH: ".",
    KILO_BASE_URL: "https://api.kilo.ai/api/gateway",
    KILO_MODEL: "kilo-auto/free",
    KILO_MODE_HINT: "debug"
  },
  enabled: true,
  timeout: 10000
};

cfg.permission["kilo-reviewer_*"] = "allow";

cfg.mcp["context7"] = {
  type: "remote",
  url: "https://mcp.context7.com/mcp",
  enabled: true,
  timeout: 15000
};

// Pinned — supply-chain controlled
cfg.mcp["mcp_everything"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", `@modelcontextprotocol/server-everything@${MCP_PINS.everything}`],
  enabled: false,
  timeout: 10000
};

// Pinned — pass allowed dirs as trailing args when enabling
cfg.mcp["filesystem"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", `@modelcontextprotocol/server-filesystem@${MCP_PINS.filesystem}`, "."],
  enabled: false,
  timeout: 10000
};

// GitHub official MCP server (replaces deprecated @modelcontextprotocol/server-github)
// toolsets: default | all | actions,repos,... — start minimal
cfg.mcp["github"] = {
  type: "local",
  command: [
    "docker", "run", "-i", "--rm",
    "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
    "-e", "GITHUB_TOOLSETS",
    "ghcr.io/github/github-mcp-server"
  ],
  environment: {
    GITHUB_PERSONAL_ACCESS_TOKEN: "{env:GITHUB_PAT}",
    GITHUB_TOOLSETS: "default"
  },
  enabled: false,
  timeout: 20000
};

// Playwright official (replaces deprecated @modelcontextprotocol/server-puppeteer)
cfg.mcp["playwright"] = {
  type: "local",
  command: ["docker", "run", "-i", "--rm", "mcp/playwright"],
  enabled: false,
  timeout: 20000
};

await writeJsonWithBackup(repoRoot, kiloPath, cfg);

// -----------------------------
// Legacy compat: .kilocode/mcp.json
// -----------------------------
const legacyPath = path.join(repoRoot, ".kilocode", "mcp.json");
const legacy = await readJsonOr({ mcpServers: {} }, legacyPath);
legacy.mcpServers ||= {};
legacy.mcpServers["kilo-reviewer"] = {
  command: "node",
  args: [serverRel],
  env: {
    REPO_PATH: ".",
    KILO_BASE_URL: "https://api.kilo.ai/api/gateway",
    KILO_MODEL: "kilo-auto/free",
    KILO_MODE_HINT: "debug"
  },
  alwaysAllow: ["kilo_review"],
  disabled: false
};
await writeJsonWithBackup(repoRoot, legacyPath, legacy);
