#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chatCompletions } from "./llm_backend.mjs";

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
const scope = arg("--scope", null);
const outMd = arg("--out-md", "docs/COUNCIL_REVIEW.md");
const outJson = arg("--out-json", "docs/COUNCIL_REVIEW.json");
const outMerged = arg("--out-merged", "docs/REVIEW_KILO.md");
const allowFail = has("--allow-fail");
const jsonStdout = has("--json");

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: GIT_MAX_BUFFER });
}

function getStagedDiff() {
  git(["-C", repoPath, "rev-parse", "--is-inside-work-tree"]);
  const a = ["-C", repoPath, "diff", "--staged"];
  if (scope) {
    const scopes = scope.split(/[,\s]+/).filter(Boolean);
    a.push("--", ...scopes);
  }
  return git(a).slice(0, MAX_DIFF_CHARS);
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
  const cleaned = String(text || "")
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
  } catch {
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
    const { content, backend, baseURL, model } = await chatCompletions({
      messages: [
        { role: "system", content: roleSystemPrompt(role) },
        { role: "user", content: `Review this staged diff:\n\n${diff}` }
      ],
      max_tokens: 1400,
      temperature: 0.2,
      modeHint: process.env.KILO_MODE_HINT || "debug"
    });
    const parsed = tryParseJson(content);
    parsed.role = role;
    parsed._meta = { backend, baseURL, model };
    results.push(parsed);
  }

  const verdict = majorityVote(results.map(r => r.vote));
  const now = new Date().toISOString();

  const mergedHigh = results.flatMap(r => r.high_risk?.map(x => `[${r.role.toUpperCase()}] ${x}`) ?? []);
  const mergedMed = results.flatMap(r => r.medium?.map(x => `[${r.role.toUpperCase()}] ${x}`) ?? []);
  const mergedTests = results.flatMap(r => r.missing_tests ?? []).map(x => x);

  const out = {
    generatedAt: now,
    scope: scope ?? null,
    verdict,
    roles: results
  };

  const md = [
    `# Council Review`,
    ``,
    `- generatedAt: ${now}`,
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
    ...(mergedHigh.length ? mergedHigh.map(x => `- ${x}`) : ["- (none)"]),
    ``,
    `## Medium`,
    ...(mergedMed.length ? mergedMed.map(x => `- ${x}`) : ["- (none)"]),
    ``,
    `## Missing tests`,
    ...(mergedTests.length ? mergedTests.map(x => `- ${x}`) : ["- (none)"]),
    ``
  ].join("\n");

  await fs.mkdir(path.dirname(outMd), { recursive: true });
  await fs.writeFile(outMd, md, "utf8");
  await fs.writeFile(outJson, JSON.stringify(out, null, 2), "utf8");

  // Keep compatibility with existing /council:review-apply
  const mergedMd = [
    `# External Review (Council via backend)`,
    ``,
    `Verdict: **${verdict}**`,
    ``,
    `## High-risk issues`,
    ...(mergedHigh.length ? mergedHigh.map(x => `- ${x}`) : ["- (none)"]),
    ``,
    `## Medium issues`,
    ...(mergedMed.length ? mergedMed.map(x => `- ${x}`) : ["- (none)"]),
    ``,
    `## Missing tests`,
    ...(mergedTests.length ? mergedTests.map(x => `- ${x}`) : ["- (none)"]),
    ``
  ].join("\n");

  await fs.writeFile(outMerged, mergedMd, "utf8");

  if (jsonStdout) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(`Wrote: ${outMd}`);
    console.log(`Wrote: ${outJson}`);
    console.log(`Wrote: ${outMerged}`);
  }
}

main().catch(err => {
  console.error(err?.stack || String(err));
  if (!allowFail) process.exit(1);
});
