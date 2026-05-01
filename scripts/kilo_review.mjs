import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const scope     = getArg("scope");    // e.g. "src/", "mcp/"
const focus     = getArg("focus") || "correctness, edge cases, security, tests";
const allowFail = args.includes("--allow-fail"); // exit 0 even on API failure

// ── Config ────────────────────────────────────────────────────────────────────
const repoPath      = process.env.REPO_PATH        || ".";
const outFile       = "docs/REVIEW_KILO.md";
const KILO_BASE_URL = process.env.KILO_BASE_URL    || "https://api.kilo.ai/api/gateway";
const KILO_MODEL    = process.env.KILO_MODEL       || "kilo-auto/free";
const MODE_HINT     = process.env.KILO_MODE_HINT   || "debug";
const MAX_DIFF_CHARS = 200_000; // keep in sync with mcp/server.mjs

// ── Safe git wrapper (no shell, no injection) ─────────────────────────────────
function git(...gitArgs) {
  const base = repoPath !== "." ? ["-C", repoPath] : [];
  return execFileSync("git", [...base, ...gitArgs], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
}

// ── Sanity check ──────────────────────────────────────────────────────────────
try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  console.log("Not a git repository. Skipping review.");
  process.exit(0);
}

// ── Diff (with optional path scope) ───────────────────────────────────────────
const diffArgs = ["diff", "--staged"];
if (scope) diffArgs.push("--", scope);
const diff = git(...diffArgs).slice(0, MAX_DIFF_CHARS);

if (!diff.trim()) {
  console.log("No staged changes found to review" + (scope ? ` in scope: ${scope}` : "") + ".");
  process.exit(0);
}

// ── Focus-specific system prompts ─────────────────────────────────────────────
const FOCUS_PROMPTS = {
  security:
    "You are a strict security code reviewer. Focus ONLY on:\n" +
    "1) Injection vulnerabilities (SQL, command, XSS)\n" +
    "2) Authentication/authorization bypass\n" +
    "3) Data exfiltration risks\n" +
    "4) Insecure defaults\n" +
    "5) Secret leakage\n" +
    "Return Markdown: Summary, Critical security issues, Medium issues, Concrete fixes.",

  performance:
    "You are a performance code reviewer. Focus ONLY on:\n" +
    "1) Unnecessary re-renders or recomputations\n" +
    "2) N+1 queries or inefficient loops\n" +
    "3) Memory leaks\n" +
    "4) Large bundle size impact\n" +
    "5) Missing caching opportunities\n" +
    "Return Markdown: Summary, High-impact perf issues, Medium issues, Concrete fixes.",

  tests:
    "You are a test quality reviewer. Focus ONLY on:\n" +
    "1) Missing test cases for changed code\n" +
    "2) Edge cases not covered\n" +
    "3) Flaky test patterns\n" +
    "4) Assertion quality\n" +
    "5) Test isolation\n" +
    "Return Markdown: Summary, Missing critical tests, Suggested test cases, Improvements.",

  correctness:
    "You are a strict senior code reviewer.\n" +
    "Return Markdown sections:\n" +
    "- Summary\n- High-risk issues\n- Medium issues\n- Low/nits\n- Concrete fixes\n- Missing tests\n" +
    "Be specific: file paths and function names."
};

const systemPrompt = FOCUS_PROMPTS[focus] ?? FOCUS_PROMPTS.correctness;

// ── Call Kilo Gateway ─────────────────────────────────────────────────────────
const body = {
  model: KILO_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Focus: ${focus}\n\nReview this staged diff${scope ? ` (scope: ${scope})` : ""}:\n\n${diff}`
    }
  ],
  temperature: 0.2,
  max_tokens: 1400
};

const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-kilocode-mode": MODE_HINT },
  body: JSON.stringify(body)
});

if (!res.ok) {
  const errBody = await res.text().catch(() => "");
  console.error(`Kilo review failed (${res.status}).\n${errBody}`);
  process.exit(allowFail ? 0 : 1); // exit(1) by default — callers must opt-in to suppress
}

const json   = await res.json();
const review = json?.choices?.[0]?.message?.content || "(empty response)";

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(outFile, review, "utf8");
console.log(review);