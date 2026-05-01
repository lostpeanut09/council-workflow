#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const mode = process.argv[2]; // gemini | claude | kilo
const passThroughIndex = process.argv.indexOf("--");
const passArgs = passThroughIndex >= 0 ? process.argv.slice(passThroughIndex + 1) : [];

if (!mode || !["gemini", "claude", "kilo"].includes(mode)) {
  console.error("Usage: node scripts/gsd-run.mjs <gemini|claude|kilo> [-- <args>]");
  process.exit(2);
}

// 1) GSD preflight HARD (obbligatorio)
run("node", ["scripts/gsd-preflight.mjs"]);

// 2) Avvio tool
if (mode === "gemini") run("gemini", passArgs);

if (mode === "kilo") {
  const backend = (process.env.COUNCIL_BACKEND || "kilo-gateway").toLowerCase();
  const env = {};
  
  if (backend === "nim" || backend === "requesty") {
    const overlay = backend === "nim"
      ? {
          provider: { "openai-compatible": { options: { apiKey: "{env:NVIDIA_NIM_API_KEY}", baseURL: process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1" } } },
          model: process.env.NIM_MODEL || "meta/llama-3.1-8b-instruct"
        }
      : {
          provider: { "openai-compatible": { options: { apiKey: "{env:REQUESTY_API_KEY}", baseURL: process.env.REQUESTY_BASE_URL || "https://router.requesty.ai/v1" } } },
          model: process.env.REQUESTY_MODEL || "policy/council-default"
        };
        
    env.KILO_CONFIG_CONTENT = JSON.stringify(overlay);
  }
  
  run("kilo", passArgs, env);
}

// Claude Code via free-claude-code proxy: richiede ANTHROPIC_BASE_URL e token
if (mode === "claude") {
  // Non appendere /v1: free-claude-code lo dice esplicitamente.
  // Default token "freecc" come nel quickstart.
  const env = {
    ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || "http://localhost:8082",
    ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || "freecc"
  };
  run("claude", passArgs, env);
}
