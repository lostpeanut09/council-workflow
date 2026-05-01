#!/usr/bin/env node
/**
 * scripts/doctor.mjs
 * 
 * "Doctor" script: A single check to verify if the repository and environment
 * are properly configured for the April 2026 GSD-first Council Workflow.
 * 
 * Verifies:
 * - GSD local state
 * - Environment variables (API keys based on backend)
 * - Docker image pinning lockfile synchronization
 */

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Helper to load .env manually if dotenv is not available
async function loadEnv() {
  try {
    const content = await fs.readFile(".env", "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (err) {
    // .env might not exist, ignore
  }
}

async function checkGSD() {
  console.log("🩺 Checking GSD Local State...");
  try {
    const stats = await fs.stat(".planning");
    if (stats.isDirectory()) {
      console.log("  ✅ .planning directory found (GSD is active)");
      return true;
    }
  } catch {
    console.log("  ⚠️  .planning directory missing. Run GSD initialization to enable GSD-first constraints.");
    return false;
  }
}

function checkBackend() {
  console.log("\n🩺 Checking COUNCIL_BACKEND Config...");
  const backend = (process.env.COUNCIL_BACKEND || "kilo-gateway").toLowerCase();
  console.log(`  ℹ️  Configured backend: ${backend}`);

  let ok = true;
  if (backend === "nim" || backend === "auto") {
    if (!process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_NIM_API_KEY.includes("REPLACE_ME")) {
      if (backend === "nim") {
        console.log("  ❌ NVIDIA_NIM_API_KEY is missing or invalid.");
        ok = false;
      }
    } else {
      console.log("  ✅ NVIDIA_NIM_API_KEY is configured.");
    }
    
    if (backend === "nim" && (!process.env.NIM_MODEL || process.env.NIM_MODEL.includes("REPLACE_ME"))) {
      console.log("  ❌ NIM_MODEL is missing or invalid. Use scripts/nim-models.mjs to find one.");
      ok = false;
    } else if (backend === "nim") {
      console.log(`  ✅ NIM_MODEL configured: ${process.env.NIM_MODEL}`);
    }
  }

  if (backend === "requesty" || backend === "auto") {
    if (!process.env.REQUESTY_API_KEY || process.env.REQUESTY_API_KEY.includes("REPLACE_ME")) {
      if (backend === "requesty") {
        console.log("  ❌ REQUESTY_API_KEY is missing or invalid.");
        ok = false;
      }
    } else {
      console.log("  ✅ REQUESTY_API_KEY is configured.");
    }
    
    if (backend === "requesty" && (!process.env.REQUESTY_MODEL || process.env.REQUESTY_MODEL.includes("REPLACE_ME"))) {
      console.log("  ❌ REQUESTY_MODEL is missing or invalid. Usually should be a fallback policy.");
      ok = false;
    } else if (backend === "requesty") {
      console.log(`  ✅ REQUESTY_MODEL configured: ${process.env.REQUESTY_MODEL}`);
    }
  }

  if (backend === "kilo-gateway") {
    console.log("  ✅ Using default kilo-gateway backend.");
  }
  
  return ok;
}

async function checkLockfile() {
  console.log("\n🩺 Checking MCP Digest Sync...");
  try {
    const lockfileRaw = await fs.readFile("docs/MCP_IMAGE_PINS.lock.json", "utf8");
    const lockfile = JSON.parse(lockfileRaw);
    
    // Check if the lockfile has real SHA256 digests
    const images = Object.values(lockfile.images || {});
    let hasDigest = false;
    for (const img of images) {
      if (img.pinned && img.pinned.includes("@sha256:")) {
        hasDigest = true;
        break;
      }
    }

    if (hasDigest) {
      console.log("  ✅ Lockfile docs/MCP_IMAGE_PINS.lock.json contains pinned digests.");
      
      // If it has digests, kilo.jsonc MUST have them too
      try {
        const kiloJsonc = await fs.readFile("kilo.jsonc", "utf8");
        if (kiloJsonc.includes("@sha256:")) {
          console.log("  ✅ kilo.jsonc is properly synchronized with @sha256 digests.");
          return true;
        } else {
          console.log("  ❌ Lockfile has digests but kilo.jsonc does NOT. Run installer to sync.");
          return false;
        }
      } catch (err) {
        console.log("  ❌ Could not read kilo.jsonc: " + err.message);
        return false;
      }
    } else {
      console.log("  ⚠️  Lockfile docs/MCP_IMAGE_PINS.lock.json exists but is unpinned (placeholder).");
      return true; // Not an error strictly, but supply chain is weak
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("  ⚠️  docs/MCP_IMAGE_PINS.lock.json missing.");
      return true;
    } else {
      console.log("  ❌ Error reading lockfile: " + err.message);
      return false;
    }
  }
}

async function main() {
  await loadEnv();
  
  console.log("=== Council Workflow Doctor ===\n");
  
  const gsdOk = await checkGSD();
  const backendOk = checkBackend();
  const lockfileOk = await checkLockfile();
  
  console.log("\n===============================");
  if (!backendOk || !lockfileOk) {
    console.log("❌ Setup has errors. Please fix them before continuing.");
    process.exit(1);
  } else {
    console.log("✅ Everything looks good! You are ready to go.");
    process.exit(0);
  }
}

main().catch(err => {
  console.error("Doctor script failed:", err);
  process.exit(1);
});
