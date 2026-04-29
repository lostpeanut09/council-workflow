import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MCP_CONFIG_PATH = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');
const REPO_ROOT = process.cwd();
const SERVER_PATH = path.join(REPO_ROOT, 'mcp', 'server.mjs');

console.log(`Installing kilo-reviewer MCP server from ${SERVER_PATH}`);

if (!fs.existsSync(MCP_CONFIG_PATH)) {
  console.error(`Config file not found at ${MCP_CONFIG_PATH}`);
  process.exit(1);
}

try {
  const config = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
  
  // Backup
  fs.writeFileSync(`${MCP_CONFIG_PATH}.bak`, JSON.stringify(config, null, 2));

  config.mcpServers = config.mcpServers || {};
  config.mcpServers["kilo-reviewer"] = {
    command: "node",
    args: [SERVER_PATH],
    env: {
      "REPO_PATH": REPO_ROOT,
      "KILO_MODEL": "kilo-auto/free"
    }
  };

  fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log("Successfully updated mcp_config.json and created a backup.");
} catch (err) {
  console.error("Failed to update config:", err.message);
  process.exit(1);
}
