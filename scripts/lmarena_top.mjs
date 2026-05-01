#!/usr/bin/env node
/**
 * Lightweight "arena.ai fallback" using the official LMArena dataset on Hugging Face:
 * dataset: lmarena-ai/leaderboard-dataset
 *
 * Uses Hugging Face Dataset Viewer API:
 *  - /splits to discover configs/splits
 *  - /rows to fetch a small slice (max 100) without downloading the whole dataset
 *
 * Usage:
 *   node scripts/lmarena_top.mjs --limit 20
 *   node scripts/lmarena_top.mjs --config text_style_control --split latest --limit 30 --json
 */

const args = process.argv.slice(2);
function getArg(name, def = null) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? def) : def;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const DATASET = "lmarena-ai/leaderboard-dataset";
const API = "https://datasets-server.huggingface.co";

const limit = Math.min(parseInt(getArg("limit", "20"), 10) || 20, 100);
const wantJson = hasFlag("json");
let config = getArg("config", null);
let split = getArg("split", null);

async function getSplits() {
  const url = `${API}/splits?dataset=${encodeURIComponent(DATASET)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`splits failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function getRows({ config, split, offset = 0, length = 50 }) {
  const url =
    `${API}/rows?dataset=${encodeURIComponent(DATASET)}` +
    `&config=${encodeURIComponent(config)}` +
    `&split=${encodeURIComponent(split)}` +
    `&offset=${offset}&length=${length}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`rows failed ${r.status}: ${await r.text()}`);
  return r.json();
}

function pickDefaultConfigAndSplit(splitsJson) {
  // splitsJson.splits is an array with { config, split, ... }
  const splits = splitsJson?.splits || [];
  if (!splits.length) throw new Error("No splits returned for dataset.");

  // Prefer config mentioned in dataset card examples, else first
  const preferredConfigs = ["text_style_control", "text"];
  const configPick =
    preferredConfigs.find(c => splits.some(s => s.config === c)) ||
    splits[0].config;

  // Prefer split=latest if exists, else first for that config
  const splitsForConfig = splits.filter(s => s.config === configPick);
  const splitPick =
    (splitsForConfig.some(s => s.split === "latest") ? "latest" : splitsForConfig[0].split);

  return { config: configPick, split: splitPick };
}

function formatRow(row) {
  // Dataset card shows common columns like model_name, organization, rating, vote_count, rank, category
  const r = row || {};
  return {
    rank: r.rank ?? null,
    model_name: r.model_name ?? r.model ?? r.model_id ?? null,
    organization: r.organization ?? null,
    rating: r.rating ?? null,
    rating_lower: r.rating_lower ?? null,
    rating_upper: r.rating_upper ?? null,
    vote_count: r.vote_count ?? null,
    category: r.category ?? null,
    leaderboard_publish_date: r.leaderboard_publish_date ?? null
  };
}

function mdTable(rows) {
  const header = `| Rank | Model | Org | Rating | Votes | Category |\n|---:|---|---|---:|---:|---|`;
  const lines = rows.map(x =>
    `| ${x.rank ?? ""} | ${x.model_name ?? ""} | ${x.organization ?? ""} | ${x.rating ?? ""} | ${x.vote_count ?? ""} | ${x.category ?? ""} |`
  );
  return [header, ...lines].join("\n");
}

async function main() {
  const splitsJson = await getSplits();
  if (!config || !split) {
    const picked = pickDefaultConfigAndSplit(splitsJson);
    config ||= picked.config;
    split ||= picked.split;
  }

  const rowsJson = await getRows({ config, split, offset: 0, length: limit });
  const rows = (rowsJson?.rows || []).map(r => formatRow(r.row));

  // Sort by rank if present; otherwise keep returned order
  const sorted = rows.slice().sort((a, b) => {
    if (a.rank == null || b.rank == null) return 0;
    return a.rank - b.rank;
  });

  const out = {
    dataset: DATASET,
    config,
    split,
    count: sorted.length,
    rows: sorted
  };

  if (wantJson) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  console.log(`# LMArena top (${DATASET})`);
  console.log(`- config: ${config}`);
  console.log(`- split: ${split}`);
  console.log(`- count: ${sorted.length}`);
  console.log("");
  console.log(mdTable(sorted));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
