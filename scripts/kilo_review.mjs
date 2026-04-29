import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const repoPath = process.env.REPO_PATH || ".";
const outFile = "docs/REVIEW_KILO.md";

const KILO_BASE_URL = process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway";
const KILO_MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const MODE_HINT = process.env.KILO_MODE_HINT || "debug";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

try {
  sh(`git -C "${repoPath}" rev-parse --is-inside-work-tree`);
} catch {
  console.log("Not a git repository. Skipping review.");
  process.exit(0);
}

const diff = sh(`git -C "${repoPath}" diff --staged`).slice(0, 200_000);
if (!diff.trim()) {
  console.log("No staged changes found to review.");
  process.exit(0);
}

const body = {
  model: KILO_MODEL,
  messages: [
    {
      role: "system",
      content:
        "You are a strict senior code reviewer.\n" +
        "Return Markdown sections:\n" +
        "- Summary\n- High-risk issues\n- Medium issues\n- Low/nits\n- Concrete fixes\n- Missing tests\n" +
        "Be specific: file paths and function names."
    },
    { role: "user", content: `Review this staged diff:\n\n${diff}` }
  ],
  temperature: 0.2,
  max_tokens: 1200
};

const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-kilocode-mode": MODE_HINT },
  body: JSON.stringify(body)
});

if (!res.ok) {
  console.log(`Kilo review failed (${res.status}).\n${await res.text()}`);
  process.exit(0);
}

const json = await res.json();
const review = json?.choices?.[0]?.message?.content || "(empty response)";

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(outFile, review, "utf8");
console.log(review);