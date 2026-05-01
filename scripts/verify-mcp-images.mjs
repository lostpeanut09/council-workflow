#!/usr/bin/env node
/**
 * scripts/verify-mcp-images.mjs
 * 
 * Extracts pinned mcp/* images from docs/MCP_IMAGE_PINS.lock.json and verifies
 * their signatures using cosign against the official Docker MCP public key.
 * 
 * Usage:
 *   node scripts/verify-mcp-images.mjs
 */

import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

const LOCKFILE = "docs/MCP_IMAGE_PINS.lock.json";
const PUBLIC_KEY_URL = "https://raw.githubusercontent.com/docker/keyring/refs/heads/main/public/mcp/latest.pub";

async function main() {
  console.log(`🔍 Verifying MCP image signatures from ${LOCKFILE}...`);
  
  let lockRaw;
  try {
    lockRaw = await fs.readFile(LOCKFILE, "utf8");
  } catch (err) {
    console.error(`❌ Could not read ${LOCKFILE}. Run installer first.`);
    process.exit(1);
  }

  const lockfile = JSON.parse(lockRaw);
  const images = lockfile.images || {};
  const mcpImages = [];

  for (const [key, value] of Object.entries(images)) {
    if (key.startsWith("mcp/") && value.pinned) {
      mcpImages.push(value.pinned);
    }
  }

  if (mcpImages.length === 0) {
    console.log("ℹ️  No pinned mcp/* images found in lockfile. Nothing to verify.");
    return;
  }

  // Check if cosign is installed
  const cosignCheck = spawnSync("cosign", ["version"], { encoding: "utf8", shell: true });
  if (cosignCheck.error || cosignCheck.status !== 0) {
    console.error("❌ 'cosign' is not installed or not in PATH.");
    console.error("Please install cosign (https://docs.sigstore.dev/cosign/installation/) and try again.");
    process.exit(1);
  }

  let allPassed = true;

  for (const imageRef of mcpImages) {
    console.log(`\n🛡️  Verifying: ${imageRef}`);
    
    // Command: COSIGN_REPOSITORY=mcp/signatures cosign verify <IMAGE> --key <URL>
    const result = spawnSync("cosign", [
      "verify",
      imageRef,
      "--key",
      PUBLIC_KEY_URL
    ], {
      encoding: "utf8",
      env: { ...process.env, COSIGN_REPOSITORY: "mcp/signatures" },
      shell: true
    });

    if (result.status === 0) {
      console.log(`  ✅ Signature verified successfully.`);
    } else {
      console.error(`  ❌ Signature verification failed!`);
      console.error(result.stderr || result.stdout);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error("\n❌ One or more images failed signature verification.");
    process.exit(1);
  } else {
    console.log("\n✅ All mcp/* images passed signature verification!");
  }
}

main().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
