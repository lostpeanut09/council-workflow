#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

function stamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
}

async function readJsonOr(defaultValue, filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return defaultValue;
  }
}

async function writeJsonWithBackup(filePath, json, backupLabel) {
  const existed = fssync.existsSync(filePath);
  if (existed) {
    const backup = `${filePath}.bak-${backupLabel}`;
    await fs.copyFile(filePath, backup);
    console.log(`Backup: ${backup}`);
  } else {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  await fs.writeFile(filePath, JSON.stringify(json, null, 2), "utf8");
  console.log(`Updated: ${filePath}`);
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());

// Keep paths PORTABLE: always write relative paths into committed configs.
const serverRel = "mcp/server.mjs";
const serverAbs = path.join(repoRoot, "mcp", "server.mjs");

if (!fssync.existsSync(serverAbs)) {
  console.error(`ERROR: MCP server not found: ${serverAbs}`);
  process.exit(1);
}

// -----------------------------
// 1) Modern config: kilo.jsonc
// -----------------------------
const kiloJsoncPath = path.join(repoRoot, "kilo.jsonc");
const kiloCfg = await readJsonOr({}, kiloJsoncPath);

kiloCfg.mcp ||= {};
kiloCfg.permission ||= {};

kiloCfg.mcp["kilo-reviewer"] = {
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

// Auto-approve MCP tools from this server (wildcard)
kiloCfg.permission["kilo-reviewer_*"] = "allow";

// Starter kit MCPs (disabled by default where appropriate)
kiloCfg.mcp["context7"] = {
  type: "remote",
  url: "https://mcp.context7.com/mcp",
  enabled: true,
  timeout: 15000
};

kiloCfg.mcp["mcp_everything"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-everything"],
  enabled: false,
  timeout: 10000
};

kiloCfg.mcp["puppeteer"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: false,
  timeout: 15000
};

kiloCfg.mcp["filesystem"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-filesystem"],
  enabled: false,
  timeout: 10000
};

await writeJsonWithBackup(kiloJsoncPath, kiloCfg, stamp());

// -------------------------------------------
// 2) Legacy/compat config: .kilocode/mcp.json
// -------------------------------------------
// Kilo docs mention a project-level .kilocode/mcp.json with `mcpServers` format.
const legacyPath = path.join(repoRoot, ".kilocode", "mcp.json");
const legacyCfg = await readJsonOr({ mcpServers: {} }, legacyPath);
legacyCfg.mcpServers ||= {};

legacyCfg.mcpServers["kilo-reviewer"] = {
  command: "node",
  args: [serverRel],
  env: {
    REPO_PATH: ".",
    KILO_BASE_URL: "https://api.kilo.ai/api/gateway",
    KILO_MODEL: "kilo-auto/free",
    KILO_MODE_HINT: "debug"
  },
  // Auto-approve tool(s) from this MCP server in legacy config format
  alwaysAllow: ["kilo_review"],
  disabled: false
};

await writeJsonWithBackup(legacyPath, legacyCfg, stamp());
