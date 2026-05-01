import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chatCompletions } from "./llm_backend.mjs";

// CLI args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const scopeRaw = getArg("scope"); // e.g. "src/" or "src/ docs/" or "src/,docs/"
const focus = getArg("focus") || "correctness";
const allowFail = hasFlag("allow-fail"); // exit 0 even on API failure
const jsonOut = hasFlag("json");

const repoPath = process.env.REPO_PATH || ".";
const outMd = "docs/REVIEW_KILO.md";
const outJson = "docs/REVIEW_KILO.json";
const MAX_DIFF_CHARS = 200_000; // keep in sync with mcp/server.mjs

function git(...gitArgs) {
  const base = repoPath !== "." ? ["-C", repoPath] : [];
  return execFileSync("git", [...base, ...gitArgs], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
}

// Sanity check
try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  console.log("Not a git repository. Skipping review.");
  process.exit(0);
}

// Diff (support multiple scopes)
const diffArgs = ["diff", "--staged"];
if (scopeRaw) {
  const scopes = scopeRaw.split(/[,\s]+/).filter(Boolean);
  diffArgs.push("--", ...scopes);
}

const diff = git(...diffArgs).slice(0, MAX_DIFF_CHARS);
if (!diff.trim()) {
  console.log("No staged changes found to review" + (scopeRaw ? ` in scope: ${scopeRaw}` : "") + ".");
  process.exit(0);
}

// Focus-specific system prompts
const FOCUS_PROMPTS = {
  security:
    "You are a strict security code reviewer. Focus ONLY on:\n" +
    "1) Injection (SQL/command/XSS)\n" +
    "2) AuthN/AuthZ bypass\n" +
    "3) Data exfiltration\n" +
    "4) Insecure defaults\n" +
    "5) Secret leakage\n" +
    "Return Markdown: Summary, Critical issues, Medium issues, Concrete fixes.",
  performance:
    "You are a performance code reviewer. Focus ONLY on:\n" +
    "1) Inefficient loops / N+1\n" +
    "2) Memory leaks\n" +
    "3) Unnecessary work\n" +
    "4) Missing caching\n" +
    "Return Markdown: Summary, High-impact perf issues, Medium issues, Concrete fixes.",
  tests:
    "You are a test quality reviewer. Focus ONLY on:\n" +
    "1) Missing tests for changed code\n" +
    "2) Edge cases not covered\n" +
    "3) Flaky patterns\n" +
    "Return Markdown: Summary, Missing critical tests, Suggested test cases, Improvements.",
  correctness:
    "You are a strict senior code reviewer.\n" +
    "Return Markdown sections:\n" +
    "- Summary\n- High-risk issues\n- Medium issues\n- Low/nits\n- Concrete fixes\n- Missing tests\n" +
    "Be specific: file paths and function names."
};

const systemPrompt = FOCUS_PROMPTS[focus] ?? FOCUS_PROMPTS.correctness;

try {
  const { backend, baseURL, model, content } = await chatCompletions({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Focus: ${focus}\n\nReview this staged diff${scopeRaw ? ` (scope: ${scopeRaw})` : ""}:\n\n${diff}`
      }
    ],
    max_tokens: 1400,
    temperature: 0.2,
    modeHint: process.env.KILO_MODE_HINT || "debug"
  });

  await fs.mkdir("docs", { recursive: true });
  await fs.writeFile(outMd, content, "utf8");

  const payload = {
    backend,
    baseURL,
    model,
    focus,
    scope: scopeRaw ?? null,
    outMd,
    review: content
  };
  await fs.writeFile(outJson, JSON.stringify(payload, null, 2), "utf8");

  if (jsonOut) console.log(JSON.stringify(payload, null, 2));
  else console.log(content);
} catch (err) {
  console.error(err?.stack || String(err));
  process.exit(allowFail ? 0 : 1);
}