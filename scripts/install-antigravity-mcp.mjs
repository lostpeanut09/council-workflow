#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") out.repo = argv[++i];
    if (a === "--config") out.config = argv[++i];
    if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = path.resolve(args.repo || process.cwd());

// default Antigravity MCP config location
const home = os.homedir();
const defaultConfigPath = path.join(home, ".gemini", "antigravity", "mcp_config.json");
const configPath = path.resolve(args.config || defaultConfigPath);

const serverPath = path.join(repoRoot, "mcp", "server.mjs");
if (!fssync.existsSync(serverPath)) {
  console.error(`ERROR: MCP server not found at: ${serverPath}`);
  process.exit(1);
}

await fs.mkdir(path.dirname(configPath), { recursive: true });

let current = { mcpServers: {} };
let existed = false;

try {
  const raw = await fs.readFile(configPath, "utf8");
  current = JSON.parse(raw);
  existed = true;
} catch (e) {
  // file doesn't exist or invalid json -> start fresh
  current = { mcpServers: {} };
}

if (!current || typeof current !== "object") current = { mcpServers: {} };
if (!current.mcpServers || typeof current.mcpServers !== "object") current.mcpServers = {};

const next = structuredClone(current);

next.mcpServers["kilo-reviewer"] = {
  command: "node",
  args: [serverPath],
  env: {
    REPO_PATH: repoRoot,
    KILO_MODEL: process.env.KILO_MODEL || "kilo-auto/free",
    KILO_BASE_URL: process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway",
    KILO_MODE_HINT: process.env.KILO_MODE_HINT || "debug"
  }
};

if (args.dryRun) {
  console.log(JSON.stringify(next, null, 2));
  process.exit(0);
}

if (existed) {
  const backupPath = `${configPath}.bak-${ts()}`;
  await fs.copyFile(configPath, backupPath);
  console.log(`Backup written: ${backupPath}`);
}

const tmpPath = `${configPath}.tmp-${ts()}`;
await fs.writeFile(tmpPath, JSON.stringify(next, null, 2), "utf8");
await fs.rename(tmpPath, configPath);

console.log(`Updated: ${configPath}`);
console.log(`Installed MCP server: kilo-reviewer -> ${serverPath}`);
