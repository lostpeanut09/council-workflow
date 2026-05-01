#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chatCompletions } from "./llm_backend.mjs";

const KILO_MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const MODE_HINT = process.env.KILO_MODE_HINT || "debug";

const MAX_DIFF_CHARS = 200_000;
const GIT_MAX_BUFFER = 10 * 1024 * 1024;

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] ?? def) : def;
}
function has(name) {
  return process.argv.includes(name);
}

const repoPath = arg("--repo", process.env.REPO_PATH || ".");
const scope = arg("--scope", null); // e.g. src/ or "src/ docs/"
const outMd = arg("--out-md", "docs/COUNCIL_REVIEW.md");
const outJson = arg("--out-json", "docs/COUNCIL_REVIEW.json");
const outMerged = arg("--out-merged", "docs/REVIEW_KILO.md");
const allowFail = has("--allow-fail");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: GIT_MAX_BUFFER });
}

function getStagedDiff() {
  git(["-C", repoPath, "rev-parse", "--is-inside-work-tree"]);
  const args = ["-C", repoPath, "diff", "--staged"];
  if (scope) {
    // Support multiple scopes separated by commas or spaces
    const scopes = scope.split(/[,\s]+/).filter(Boolean);
    args.push("--", ...scopes);
  }
  return git(args).slice(0, MAX_DIFF_CHARS);
}

async function kilo(messages) {
  return chatCompletions({
    messages,
    max_tokens: 1400,
    temperature: 0.2,
    extraHeaders: { "x-kilocode-mode": MODE_HINT }
  });
}

function roleSystemPrompt(role) {
  const base = [
    "Return ONLY valid JSON.",
    "Schema:",
    "{ role, vote, summary, high_risk:[], medium:[], low:[], missing_tests:[], suggested_fixes:[] }",
    "vote is POSITIVE or NEGATIVE.",
    "Be specific with file paths/functions. Prefer minimal changes."
  ].join("\n");

  if (role === "architecture") {
    return base + "\nFocus: correctness, design/abstractions, maintainability, interfaces, error handling, API compatibility.";
  }
  if (role === "security") {
    return base + "\nFocus: secrets, injection, authZ/authN, data exfil, unsafe I/O, dependency/supply-chain, SSRF, path traversal.";
  }
  return base + "\nFocus: tests, edge cases, regressions, determinism, observability, CI, lint, performance traps.";
}

function tryParseJson(text) {
  // model might wrap json in fences; strip common wrappers
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function majorityVote(votes) {
  const positives = votes.filter(v => v === "POSITIVE").length;
  return positives >= 2 ? "PASS" : "FAIL";
}

function mdEsc(s) {
  return String(s ?? "").replaceAll("\n", " ");
}

async function main() {
  let diff;
  try {
    diff = getStagedDiff();
  } catch (e) {
    console.log("No git repo or cannot read staged diff. Skipping.");
    process.exit(0);
  }

  if (!diff.trim()) {
    console.log("No staged changes to review.");
    process.exit(0);
  }

  const roles = ["architecture", "security", "qa"];
  const results = [];

  for (const role of roles) {
    const content = await kilo([
      { role: "system", content: roleSystemPrompt(role) },
      { role: "user", content: `Review this staged diff:\n\n${diff}` }
    ]);

    const parsed = tryParseJson(content);
    parsed.role = role;
    results.push(parsed);
  }

  const verdict = majorityVote(results.map(r => r.vote));
  const now = new Date().toISOString();

  const mergedHigh = results.flatMap(r => r.high_risk?.map(x => `[${r.role.toUpperCase()}] ${x}`) ?? []);
  const mergedMed  = results.flatMap(r => r.medium?.map(x => `[${r.role.toUpperCase()}] ${x}`) ?? []);
  const mergedTests = results.flatMap(r => r.missing_tests ?? []).map(x => x);

  const out = {
    generatedAt: now,
    model: KILO_MODEL,
    modeHint: MODE_HINT,
    scope: scope ?? null,
    verdict,
    roles: results
  };

  const md = [
    `# Council Review`,
    ``,
    `- generatedAt: ${now}`,
    `- model: ${KILO_MODEL}`,
    `- scope: ${scope ?? "(all staged)"}`,
    `- verdict: **${verdict}** (majority vote, 2/3)`,
    ``,
    `## Votes`,
    ``,
    `| Role | Vote | Summary |`,
    `|---|---|---|`,
    ...results.map(r => `| ${r.role} | ${r.vote} | ${mdEsc(r.summary)} |`),
    ``,
    `## High risk`,
    ...mergedHigh.map(x => `- ${x}`),
    mergedHigh.length ? "" : "- (none)",
    ``,
    `## Medium`,
    ...mergedMed.map(x => `- ${x}`),
    mergedMed.length ? "" : "- (none)",
    ``,
    `## Missing tests`,
    ...mergedTests.map(x => `- ${x}`),
    mergedTests.length ? "" : "- (none)",
    ``
  ].join("\n");

  await fs.mkdir(path.dirname(outMd), { recursive: true });
  await fs.writeFile(outMd, md, "utf8");
  await fs.writeFile(outJson, JSON.stringify(out, null, 2), "utf8");

  // Single-feed summary to keep your existing /council:review-apply working.
  const mergedMd = [
    `# External Review (Council via Kilo)`,
    ``,
    `Verdict: **${verdict}**`,
    ``,
    `## High-risk issues`,
    ...mergedHigh.map(x => `- ${x}`),
    mergedHigh.length ? "" : "- (none)",
    ``,
    `## Medium issues`,
    ...mergedMed.map(x => `- ${x}`),
    mergedMed.length ? "" : "- (none)",
    ``,
    `## Missing tests`,
    ...mergedTests.map(x => `- ${x}`),
    mergedTests.length ? "" : "- (none)",
    ``
  ].join("\n");

  await fs.writeFile(outMerged, mergedMd, "utf8");

  console.log(`Wrote: ${outMd}`);
  console.log(`Wrote: ${outJson}`);
  console.log(`Wrote: ${outMerged}`);
}

main().catch(err => {
  console.error(err?.stack || String(err));
  if (!allowFail) process.exit(1);
});

