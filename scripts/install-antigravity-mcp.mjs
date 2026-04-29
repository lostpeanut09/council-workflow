#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const serverPath = path.join(repoRoot, "mcp", "server.mjs");
if (!fssync.existsSync(serverPath)) {
  console.error(`ERROR: MCP server not found: ${serverPath}`);
  process.exit(1);
}

const configPath = path.join(os.homedir(), ".gemini", "antigravity", "mcp_config.json");
await fs.mkdir(path.dirname(configPath), { recursive: true });

let cfg = { mcpServers: {} };
let existed = false;

try {
  cfg = JSON.parse(await fs.readFile(configPath, "utf8"));
  existed = true;
} catch {
  cfg = { mcpServers: {} };
}

cfg.mcpServers ||= {};
const next = structuredClone(cfg);

next.mcpServers["kilo-reviewer"] = {
  command: "node",
  args: [serverPath],
  env: {
    REPO_PATH: repoRoot,
    KILO_BASE_URL: "https://api.kilo.ai/api/gateway",
    KILO_MODEL: "kilo-auto/free",
    KILO_MODE_HINT: "debug"
  }
};

if (existed) {
  const backup = `${configPath}.bak-${stamp()}`;
  await fs.copyFile(configPath, backup);
  console.log(`Backup: ${backup}`);
}

const tmp = `${configPath}.tmp-${stamp()}`;
await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
await fs.rename(tmp, configPath);

console.log(`Updated: ${configPath}`);
