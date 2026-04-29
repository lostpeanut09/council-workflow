#!/usr/bin/env node
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

function stamp() {
  const d = new Date();
  return d.toISOString().replaceAll(":", "").replaceAll(".", "");
}

const repoRoot = path.resolve(process.argv[2] || process.cwd());
const targetPath = path.join(repoRoot, ".kilo", "kilo.jsonc");
const serverPath = path.join(repoRoot, "mcp", "server.mjs");

await fs.mkdir(path.dirname(targetPath), { recursive: true });

let cfg = {};
let existed = false;

try {
  cfg = JSON.parse(await fs.readFile(targetPath, "utf8"));
  existed = true;
} catch {
  cfg = {};
}

if (!cfg.mcp || typeof cfg.mcp !== "object") cfg.mcp = {};

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

if (existed) {
  const backup = `${targetPath}.bak-${stamp()}`;
  await fs.copyFile(targetPath, backup);
  console.log(`Backup: ${backup}`);
}

await fs.writeFile(targetPath, JSON.stringify(cfg, null, 2), "utf8");
console.log(`Updated: ${targetPath}`);
