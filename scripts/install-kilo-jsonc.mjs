#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

function stamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const serverPath = path.join(repoRoot, "mcp", "server.mjs");
const targetPath = path.join(repoRoot, "kilo.jsonc");

if (!fssync.existsSync(serverPath)) {
  console.error(`ERROR: MCP server not found: ${serverPath}`);
  process.exit(1);
}

let cfg = {};
let existed = false;
try {
  cfg = JSON.parse(await fs.readFile(targetPath, "utf8"));
  existed = true;
} catch {
  cfg = {};
}

cfg.mcp ||= {};
cfg.permission ||= {};

// 1) Il tuo reviewer MCP locale
cfg.mcp["kilo-reviewer"] = {
  type: "local",
  command: ["node", serverPath],
  environment: {
    REPO_PATH: repoRoot,
    KILO_BASE_URL: "https://api.kilo.ai/api/gateway",
    KILO_MODEL: "kilo-auto/free",
    KILO_MODE_HINT: "debug"
  },
  enabled: true,
  timeout: 10000
};
cfg.permission["kilo-reviewer_*"] = "allow";

// 2) Context7 (remote docs) – esempio ufficiale Kilo
cfg.mcp["context7"] = {
  type: "remote",
  url: "https://mcp.context7.com/mcp",
  enabled: true,
  timeout: 15000
};

// 3) Everything test server (debug) – esempio ufficiale Kilo
cfg.mcp["mcp_everything"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-everything"],
  enabled: false,
  timeout: 10000
};

// 4) Puppeteer (browser automation) – esempio Kilo (Windows via cmd)
cfg.mcp["puppeteer"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: false,
  timeout: 15000
};

// 5) Filesystem (ATTENZIONE: abilitalo solo se ti serve)
cfg.mcp["filesystem"] = {
  type: "local",
  command: ["cmd", "/c", "npx", "-y", "@modelcontextprotocol/server-filesystem"],
  enabled: false,
  timeout: 10000
};

if (existed) {
  const backup = `${targetPath}.bak-${stamp()}`;
  await fs.copyFile(targetPath, backup);
  console.log(`Backup: ${backup}`);
}

await fs.writeFile(targetPath, JSON.stringify(cfg, null, 2), "utf8");
console.log(`Updated: ${targetPath}`);
