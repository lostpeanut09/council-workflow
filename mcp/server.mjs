import { z } from "zod";
import { execSync } from "node:child_process";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const KILO_BASE_URL = "https://api.kilo.ai/api/gateway";
const DEFAULT_MODEL = "kilo-auto/free";

// IMPORTANT: non fare console.log() su stdout in un server stdio MCP.
// Se devi loggare, usa stderr:
function logErr(...args) {
  console.error("[kilo-reviewer]", ...args);
}

function getGitDiff(repoPath, includeStaged, includeUnstaged) {
  const parts = [];
  try {
    const gitPath = repoPath === "." ? "" : `-C "${repoPath}"`;
    if (includeUnstaged) {
      parts.push(execSync(`git ${gitPath} diff`, { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 }));
    }
    if (includeStaged) {
      parts.push(execSync(`git ${gitPath} diff --staged`, { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 }));
    }
  } catch (err) {
    logErr("Git diff error:", err.message);
    return "(error getting diff)";
  }
  const diff = parts.join("\n\n").trim();
  return diff || "(no diff)";
}

async function kiloChatCompletion({ model, modeHint, messages, temperature = 0.2, max_tokens = 1200 }) {
  const headers = { "Content-Type": "application/json" };

  // Anonymous ok for free models; se vuoi usare una key, mettila come env var.
  if (process.env.KILO_API_KEY && process.env.KILO_API_KEY.trim()) {
    headers["Authorization"] = `Bearer ${process.env.KILO_API_KEY.trim()}`;
  }

  // Mode hint opzionale per routing di kilo-auto (valori tipici: code/debug/architect/ask)
  if (modeHint) headers["x-kilocode-mode"] = modeHint;

  const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Kilo error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json?.choices?.[0]?.message?.content ?? "";
}

const server = new McpServer({ name: "kilo-reviewer", version: "0.1.0" });

server.tool(
  "kilo_review",
  "Reviews a git diff using Kilo Gateway free routing (kilo-auto/free).",
  {
    repoPath: z.string().default(process.env.REPO_PATH || "."),
    includeStaged: z.boolean().default(true),
    includeUnstaged: z.boolean().default(true),
    focus: z.string().default("correctness, edge cases, security, tests"),
    diffOverride: z.string().optional(),
    modeHint: z.string().default("debug"),
    model: z.string().default(process.env.KILO_MODEL || DEFAULT_MODEL),
  },
  async ({ repoPath, includeStaged, includeUnstaged, focus, diffOverride, modeHint, model }) => {
    try {
      const diff = (diffOverride ?? getGitDiff(repoPath, includeStaged, includeUnstaged)).slice(0, 250_000);

      const messages = [
        {
          role: "system",
          content:
            "You are a strict senior code reviewer. Output:\n" +
            "1) Summary\n2) High-risk issues (bulleted)\n3) Medium/low issues\n4) Concrete fixes\n5) Missing tests\n" +
            "Be specific: file paths/functions when possible.",
        },
        { role: "user", content: `Focus: ${focus}\n\nDIFF:\n${diff}` },
      ];

      const review = await kiloChatCompletion({ model, modeHint, messages, temperature: 0.2, max_tokens: 1400 });

      return {
        content: [{ type: "text", text: review }],
      };
    } catch (err) {
      logErr(err?.stack || String(err));
      return {
        content: [{ type: "text", text: `Error: ${err?.message || String(err)}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

