#!/usr/bin/env node
/**
 * update-mcp-pins.mjs
 * Checks npm for the latest stable version of each pinned MCP package
 * and proposes a diff. Does NOT auto-update — print only, decide manually.
 *
 * Usage: node scripts/update-mcp-pins.mjs
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installerPath = path.join(repoRoot, "scripts", "install-kilo-jsonc.mjs");

// Packages to check (pinned in install-kilo-jsonc.mjs)
const PACKAGES = [
  "@modelcontextprotocol/server-filesystem",
  "@modelcontextprotocol/server-everything"
];

function npmLatest(pkg) {
  try {
    return execSync(`npm view ${pkg} version`, { encoding: "utf8" }).trim();
  } catch {
    return "ERROR";
  }
}

function npmAdvisory(pkg) {
  try {
    const result = execSync(`npm audit --json 2>/dev/null || echo "{}"`, {
      encoding: "utf8",
      cwd: repoRoot
    });
    const audit = JSON.parse(result);
    const vulns = Object.values(audit.vulnerabilities || {}).filter(v =>
      v.name === pkg
    );
    return vulns.length > 0 ? `⚠️  ${vulns.length} advisory` : "✅ clean";
  } catch {
    return "⚠️  advisory check failed";
  }
}

// Extract current pins from installer
const installerSrc = readFileSync(installerPath, "utf8");
const pinsMatch = installerSrc.match(/const MCP_PINS = \{([^}]+)\}/s);
const currentPins = {};
if (pinsMatch) {
  for (const line of pinsMatch[1].split("\n")) {
    const m = line.match(/(\w+):\s*"([^"]+)"/);
    if (m) currentPins[m[1]] = m[2];
  }
}

console.log("\n📦 MCP Package Pin Status\n");
console.log("Package".padEnd(50), "Pinned".padEnd(16), "Latest".padEnd(16), "Advisory");
console.log("─".repeat(100));

for (const pkg of PACKAGES) {
  const shortName = pkg.replace("@modelcontextprotocol/server-", "");
  const pinned = currentPins[shortName] ?? "(not pinned)";
  const latest = npmLatest(pkg);
  const advisory = npmAdvisory(pkg);
  const needsUpdate = pinned !== latest ? "⬆️  update available" : "✅ up to date";

  console.log(pkg.padEnd(50), pinned.padEnd(16), latest.padEnd(16), advisory);
  if (pinned !== latest) {
    console.log(`  → In install-kilo-jsonc.mjs: change ${shortName}: "${pinned}" to "${latest}"`);
    console.log(`  → In kilo.jsonc: update command array with @${latest}`);
  }
}

console.log("\n⚠️  This script is READ-ONLY. Apply changes manually after review.");
console.log("📖 Advisory DB: https://advisories.gitlab.com/pkg/npm/@modelcontextprotocol/\n");
