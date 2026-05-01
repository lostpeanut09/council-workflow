#!/usr/bin/env node
/**
 * scripts/nim-models.mjs
 * 
 * Fetches the available models from the NVIDIA NIM endpoint to help
 * developers correctly configure their NIM_MODEL.
 * 
 * Usage:
 *   node scripts/nim-models.mjs
 */

import fs from "node:fs/promises";

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
    // .env might not exist
  }
}

async function main() {
  await loadEnv();

  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const baseUrl = (process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");

  if (!apiKey || apiKey.includes("REPLACE_ME")) {
    console.error("❌ NVIDIA_NIM_API_KEY is not configured or invalid in your .env");
    process.exit(1);
  }

  console.log(`Fetching available models from NVIDIA NIM (${baseUrl}/models)...`);

  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`❌ HTTP Error ${res.status}: ${txt}`);
      process.exit(1);
    }

    const data = await res.json();
    const models = data.data || [];
    
    if (models.length === 0) {
      console.log("⚠️  No models returned from the API.");
      return;
    }

    console.log(`\n✅ Successfully retrieved ${models.length} models:\n`);
    
    // Sort models alphabetically
    models.sort((a, b) => a.id.localeCompare(b.id));

    models.forEach(m => {
      console.log(`  - ${m.id}`);
    });

    console.log("\n💡 Pick one of these IDs and set it as NIM_MODEL in your .env file.");
  } catch (err) {
    console.error("❌ Failed to connect to NVIDIA NIM:", err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
