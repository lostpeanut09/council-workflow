import { execSync } from "node:child_process";

const KILO_BASE_URL = process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway";
const MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const MODE_HINT = process.env.KILO_MODE_HINT || "debug";
const REPO_PATH = process.env.REPO_PATH || ".";

function isGitRepo(path) {
  try {
    execSync(`git -C "${path}" rev-parse --is-inside-work-tree`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!isGitRepo(REPO_PATH)) {
  console.log("Not a git repository (or REPO_PATH is wrong). Skipping review.");
  process.exit(0);
}

const diff = execSync(`git -C "${REPO_PATH}" diff --staged`, {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 10,
}).slice(0, 200_000);

if (!diff.trim()) {
  console.log("No staged changes found to review.");
  process.exit(0);
}

const body = {
  model: MODEL,
  messages: [
    {
      role: "system",
      content:
        "You are a strict senior code reviewer.\n" +
        "Return:\n1) Summary\n2) High-risk issues\n3) Medium/low issues\n4) Concrete fixes\n5) Missing tests\n" +
        "Be specific: file paths and function names.",
    },
    { role: "user", content: `Review this staged diff:\n\n${diff}` },
  ],
  temperature: 0.2,
  max_tokens: 1200,
};

async function runReview() {
  try {
    const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kilocode-mode": MODE_HINT,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(`Kilo review failed (${res.status}). Body:\n${text}`);
      process.exit(0);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    console.log(content || "(empty response)");
  } catch (err) {
    console.error("Fetch error:", err.message);
    process.exit(1);
  }
}

runReview();