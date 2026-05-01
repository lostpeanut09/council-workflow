#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const runtimes = ["gemini", "kilo", "claude"]; // always
for (const rt of runtimes) {
  // Non-interactive install per runtime + local
  run("npx", ["-y", "get-shit-done-cc@latest", `--${rt}`, "--local"]);
}
