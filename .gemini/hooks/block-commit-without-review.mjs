#!/usr/bin/env node
import fs from "node:fs";

let input;
try {
  const data = fs.readFileSync(0, "utf8");
  if (!data) {
    process.stdout.write("{}");
    process.exit(0);
  }
  input = JSON.parse(data);
} catch (e) {
  deny(`Error parsing hook input: ${e.message}`);
}

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

if (!fs.existsSync("docs/REVIEW_KILO.md")) {
  deny(`Blocked: ${cmd}\nReason: missing docs/REVIEW_KILO.md. Run /council:review first.`);
}

process.stdout.write("{}");
