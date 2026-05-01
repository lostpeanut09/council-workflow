#!/usr/bin/env node
/**
 * Lightweight LMArena fallback decision layer using Hugging Face Datasets API.
 * This avoids the need for a heavy MCP server to check leaderboard rankings.
 */
import https from "node:https";

const DATASET_URL = "https://datasets-server.huggingface.co/rows?dataset=lmarena-ai/leaderboard-dataset&config=text&split=latest&offset=0&length=50";

function fetchLeaderboard() {
  return new Promise((resolve, reject) => {
    https.get(DATASET_URL, { headers: { "User-Agent": "council-workflow-arena-fallback/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to fetch from HF Datasets Server: ${res.statusCode} ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse LMArena JSON response"));
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  try {
    const json = await fetchLeaderboard();
    if (!json || !json.rows || !Array.isArray(json.rows)) {
      throw new Error("Unexpected dataset format received.");
    }
    
    console.log("=== LMArena Top 15 Models (text split, overall) ===");
    const rows = json.rows.map(r => r.row).slice(0, 15);
    rows.forEach((row, index) => {
      // The dataset typically contains model names and elo scores.
      // Adjust keys depending on the actual schema of lmarena-ai/leaderboard-dataset.
      const model = row.Model || row.model || "Unknown";
      const elo = row.Elo || row.elo || row.rating || "N/A";
      console.log(`${index + 1}. ${model} (Elo: ${elo})`);
    });
    console.log("===================================================");
    console.log("Use this list to configure NIM_MODEL or REQUESTY_MODEL appropriately.");
  } catch (err) {
    console.error("LMArena Fallback Error:", err.message);
    process.exit(1);
  }
}

main();
