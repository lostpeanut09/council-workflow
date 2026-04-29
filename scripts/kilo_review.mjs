import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const KILO_BASE_URL = process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway";
const KILO_MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const MODE_HINT = process.env.KILO_MODE_HINT || "debug";

const repoPath = process.env.REPO_PATH || ".";
const outFile = process.env.COUNCIL_REVIEW_FILE || "docs/REVIEW_KILO.md";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 });
}

let diff = "";
try {
  sh(`git -C "${repoPath}" rev-parse --is-inside-work-tree`);
  diff = sh(`git -C "${repoPath}" diff --staged`).slice(0, 200_000);
} catch {
  console.log("Not a git repository (or REPO_PATH wrong). Skipping review.");
  process.exit(0);
}

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
        "Return:\n" +
        "1) Summary\n" +
        "2) High-risk issues (bulleted)\n" +
        "3) Medium issues\n" +
        "4) Low/nits\n" +
        "5) Concrete fixes\n" +
        "6) Missing tests\n" +
        "Be specific: file paths and function names."
    },
    { role: "user", content: `Review this staged diff:\n\n${diff}` }
  ],
  temperature: 0.2,
  max_tokens: 1200
};

const headers = {
  "Content-Type": "application/json",
  "x-kilocode-mode": MODE_HINT
};

// Optional: if you ever add a Kilo key
if (process.env.KILO_API_KEY?.trim()) {
  headers["Authorization"] = `Bearer ${process.env.KILO_API_KEY.trim()}`;
}

async function runReview() {
  try {
    const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(`Kilo review failed (${res.status}). Body:\n${text}`);
      process.exit(0);
    }

    const json = await res.json();
    const review = json?.choices?.[0]?.message?.content || "(empty response)";

    // persist + print (so Gemini CLI can inject it)
    await fs.mkdir("docs", { recursive: true });
    await fs.writeFile(outFile, review, "utf8");
    console.log(review);
  } catch (err) {
    console.error("Fetch error:", err.message);
    process.exit(1);
  }
}

runReview();