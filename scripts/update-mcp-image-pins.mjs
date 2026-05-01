#!/usr/bin/env node
/**
 * update-mcp-image-pins.mjs
 *
 * Pulls MCP Docker images and writes their immutable RepoDigests
 * (@sha256:...) to docs/MCP_IMAGE_PINS.lock.json.
 *
 * Requirements: Docker running locally.
 *
 * Usage:
 *   node scripts/update-mcp-image-pins.mjs
 *   git add docs/MCP_IMAGE_PINS.lock.json
 *   git commit -m "chore: update docker MCP image digest pins"
 *
 * Verification (cosign, for mcp/* Verified Publisher images):
 *   COSIGN_REPOSITORY=mcp/signatures \
 *   cosign verify mcp/playwright \
 *     --key https://raw.githubusercontent.com/docker/keyring/refs/heads/main/public/mcp/latest.pub
 */

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = path.join(repoRoot, "docs", "MCP_IMAGE_PINS.lock.json");

const IMAGES = [
  "mcp/playwright",
  "ghcr.io/github/github-mcp-server"
];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`FAIL: ${cmd} ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function repoDigest(imageRef) {
  console.log(`Pulling ${imageRef} ...`);
  run("docker", ["pull", imageRef]);

  // RepoDigests is populated after pull: ["mcp/playwright@sha256:abc..."]
  const raw = run("docker", ["image", "inspect", "--format", "{{json .RepoDigests}}", imageRef]);
  const digests = JSON.parse(raw);

  if (!Array.isArray(digests) || digests.length === 0) {
    throw new Error(`No RepoDigests found for ${imageRef} — image may not be from a registry`);
  }
  return digests[0]; // e.g. "mcp/playwright@sha256:abc123..."
}

// Check Docker is available
try {
  run("docker", ["info", "--format", "{{.ServerVersion}}"]);
} catch {
  console.error("❌ Docker is not running or not installed. Start Docker Desktop and retry.");
  process.exit(1);
}

const result = {
  generatedAt: new Date().toISOString(),
  images: {}
};

let failed = false;
for (const ref of IMAGES) {
  try {
    const pinned = repoDigest(ref);
    result.images[ref] = { ref, pinned };
    console.log(`  ✅ ${ref}`);
    console.log(`     → ${pinned}`);
  } catch (err) {
    console.error(`  ❌ ${ref}: ${err.message}`);
    result.images[ref] = { ref, pinned: null, error: err.message };
    failed = true;
  }
}

await fs.mkdir(path.dirname(lockPath), { recursive: true });
await fs.writeFile(lockPath, JSON.stringify(result, null, 2), "utf8");
console.log(`\nWrote ${lockPath}`);

if (failed) {
  console.error("\n⚠️  Some images failed. Fix errors and re-run before committing.");
  process.exit(1);
}

console.log("\n✅ All digests updated. Next steps:");
console.log("  git add docs/MCP_IMAGE_PINS.lock.json");
console.log("  git commit -m \"chore: update docker MCP image digest pins\"");
console.log("  # Then run install-kilo-jsonc.mjs to regenerate kilo.jsonc with pinned refs");
