import { z } from "zod";
import { execFileSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { chatCompletions } from "../scripts/llm_backend.mjs";

const DEFAULT_MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const DEFAULT_MODE = process.env.KILO_MODE_HINT || "debug";

function logErr(...args) {
  console.error("[kilo-reviewer]", ...args);
}

// Shared limit — keep in sync with scripts/kilo_review.mjs
const MAX_DIFF_CHARS = 200_000;

function getGitDiff(repoPath, includeStaged, includeUnstaged) {
  const parts = [];
  const base = repoPath && repoPath !== "." ? ["-C", repoPath] : [];
  const opts = { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 };
  try {
    if (includeUnstaged) parts.push(execFileSync("git", [...base, "diff"], opts));
    if (includeStaged) parts.push(execFileSync("git", [...base, "diff", "--staged"], opts));
  } catch (e) {
    return `Error getting diff: ${e.message}`;
  }
  return parts.join("\n\n").trim() || "(no diff)";
}

const server = new McpServer({ name: "kilo-reviewer", version: "1.1.0" });

server.registerTool(
  "kilo_review",
  {
    description:
      "Review code diffs using the configured backend (kilo-gateway/nim/requesty).\n" +
      "Returns structured Markdown feedback with severity-ranked issues and concrete fixes.",
    repoPath: z.string().default(process.env.REPO_PATH || ".").describe("Path to the git repository root"),
    includeStaged: z.boolean().default(true).describe("Include staged changes in the diff"),
    includeUnstaged: z.boolean().default(true).describe("Include unstaged changes in the diff"),
    focus: z.string().default("correctness, edge cases, security, tests").describe("Review focus"),
    diffOverride: z.string().optional().describe("Override diff content instead of reading from git"),
    modeHint: z.string().default(DEFAULT_MODE).describe("Mode hint (Kilo only)"),
    model: z.string().default(DEFAULT_MODEL).describe("Model override (optional; defaults to env/backend config)")
  },
  async ({ repoPath, includeStaged, includeUnstaged, focus, diffOverride, modeHint, model }) => {
    try {
      const diff = (diffOverride ?? getGitDiff(repoPath, includeStaged, includeUnstaged)).slice(0, MAX_DIFF_CHARS);

      const messages = [
        {
          role: "system",
          content:
            "You are a strict senior code reviewer. Return:\n" +
            "1) Summary\n2) High-risk issues\n3) Medium issues\n4) Low/nits\n5) Concrete fixes\n6) Missing tests\n" +
            "Be specific with file paths and function names."
        },
        { role: "user", content: `Focus: ${focus}\n\nDIFF:\n${diff}` }
      ];

      const { content: review } = await chatCompletions({
        messages,
        temperature: 0.2,
        max_tokens: 1400,
        modelOverride: model,
        modeHint
      });

      return { content: [{ type: "text", text: review }], structuredContent: { review } };
    } catch (err) {
      logErr(err?.stack || String(err));
      return { content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }], isError: true };
    }
  }
);

await server.connect(new StdioServerTransport());