#!/usr/bin/env node
import fs from "node:fs";

let inputRaw = "";
try {
  inputRaw = fs.readFileSync(0, "utf8");
} catch (e) {
  process.exit(0);
}

if (!inputRaw.trim()) process.exit(0);

const input = JSON.parse(inputRaw);
const tool = input.tool_name;
const toolInput = input.tool_input || {};

function deny(reason) {
  process.stdout.write(JSON.stringify({ decision: "deny", reason }));
  process.exit(0);
}

if (tool !== "run_shell_command") {
  process.stdout.write("{}");
  process.exit(0);
}

const cmd = String(toolInput.command || "");
const looksLikeCommit = /\bgit\b.*\b(commit|push)\b/i.test(cmd);

if (!looksLikeCommit) {
  process.stdout.write("{}");
  process.exit(0);
}

const reviewPath = "docs/REVIEW_KILO.md";
if (!fs.existsSync(reviewPath)) {
  deny(`Blocked: ${cmd}\nReason: missing ${reviewPath}. Run /council:review first.`);
}

process.stdout.write("{}");
