const KILO_BASE_URL = process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway";
const KILO_MODEL = process.env.KILO_MODEL || "kilo-auto/free";
const MODE_HINT = process.env.KILO_MODE_HINT || "debug";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO; // "owner/name"
const PR_NUMBER = process.env.PR_NUMBER;

if (!GITHUB_TOKEN || !REPO || !PR_NUMBER) {
  console.error("Missing env: GITHUB_TOKEN, REPO, PR_NUMBER");
  process.exit(1);
}

const marker = "<!-- council-workflow:kilo-pr-review -->";

async function gh(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      ...(opts.headers || {})
    }
  });
  return res;
}

async function getPrDiff() {
  const url = `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`;
  const res = await gh(url, { headers: { "Accept": "application/vnd.github.v3.diff" } });
  if (!res.ok) throw new Error(`Failed to fetch PR diff: ${res.status} ${await res.text()}`);
  const diff = await res.text();
  return diff.slice(0, 200_000);
}

async function kiloReview(diff) {
  const headers = {
    "Content-Type": "application/json",
    "x-kilocode-mode": MODE_HINT
  };
  if (process.env.KILO_API_KEY?.trim()) {
    headers["Authorization"] = `Bearer ${process.env.KILO_API_KEY.trim()}`;
  }

  const body = {
    model: KILO_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a strict PR reviewer.\n" +
          "Return Markdown with sections:\n" +
          "- Summary\n- High-risk issues\n- Medium issues\n- Suggested tests\n- Concrete patch ideas\n" +
          "Be specific: file paths and functions."
      },
      { role: "user", content: `Review this PR diff:\n\n${diff}` }
    ],
    temperature: 0.2,
    max_tokens: 1200
  };

  const res = await fetch(`${KILO_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) return `Kilo review failed (${res.status}).\n\n\`\`\`\n${await res.text()}\n\`\`\``;

  const json = await res.json();
  return json?.choices?.[0]?.message?.content || "(empty response)";
}

async function upsertComment(markdown) {
  // list last 100 comments
  const listUrl = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`;
  const listRes = await gh(listUrl);
  if (!listRes.ok) throw new Error(`Failed to list comments: ${listRes.status} ${await listRes.text()}`);
  const comments = await listRes.json();

  const existing = comments.find(c => typeof c.body === "string" && c.body.includes(marker));

  const body = `${marker}\n## Council review (Kilo Gateway: ${KILO_MODEL})\n\n${markdown}\n\n---\n*Generated automatically. Free-tier requests may be rate-limited.*`;

  if (existing) {
    const patchUrl = `https://api.github.com/repos/${REPO}/issues/comments/${existing.id}`;
    const patchRes = await gh(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    if (!patchRes.ok) throw new Error(`Failed to update comment: ${patchRes.status} ${await patchRes.text()}`);
    return;
  }

  const createUrl = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const createRes = await gh(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body })
  });
  if (!createRes.ok) throw new Error(`Failed to create comment: ${createRes.status} ${await createRes.text()}`);
}

try {
  const diff = await getPrDiff();
  const review = await kiloReview(diff);
  await upsertComment(review);
  console.log("Posted/updated PR review comment.");
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
