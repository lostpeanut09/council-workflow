#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

function stamp() {
  return new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const targetPath = path.join(repoRoot, "kilo.jsonc");
const serverPath = path.join(repoRoot, "mcp", "server.mjs");

if (!fssync.existsSync(serverPath)) {
  console.error(`ERROR: MCP server not found: ${serverPath}`);
  process.exit(1);
}

// Basic validation: check if file is not empty
const stats = fssync.statSync(serverPath);
if (stats.size === 0) {
  console.error(`ERROR: MCP server file is empty: ${serverPath}`);
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
  timeout: 20000
};

// opzionale: auto-approve tool MCP (se vuoi approval manuale, rimuovi questa sezione)
cfg.permission ||= {};
cfg.permission["kilo-reviewer_*"] = "allow";

if (existed) {
  const backup = `${targetPath}.bak-${stamp()}`;
  await fs.copyFile(targetPath, backup);
  console.log(`Backup: ${backup}`);
}

await fs.writeFile(targetPath, JSON.stringify(cfg, null, 2), "utf8");
console.log(`Updated: ${targetPath}`);
