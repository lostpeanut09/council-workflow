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

if (mode === "kilo") run("kilo", passArgs);

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
