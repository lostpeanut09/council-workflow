// scripts/llm_backend.mjs
export function getBackend() {
  return (process.env.COUNCIL_BACKEND || "kilo-gateway").toLowerCase();
}

export function getChatEndpoint() {
  const b = getBackend();

  if (b === "nim") {
    return {
      baseURL: process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_NIM_API_KEY || "",
      model: process.env.NIM_MODEL || "meta/llama-3.1-8b-instruct",
      headerAuth: "Authorization",
      headerPrefix: "Bearer "
    };
  }

  if (b === "requesty") {
    return {
      baseURL: process.env.REQUESTY_BASE_URL || "https://router.requesty.ai/v1",
      apiKey: process.env.REQUESTY_API_KEY || "",
      model: process.env.REQUESTY_MODEL || "policy/council-default",
      headerAuth: "Authorization",
      headerPrefix: "Bearer "
    };
  }

  // default: Kilo Gateway (OpenAI-compatible)
  return {
    baseURL: process.env.KILO_GATEWAY_BASE_URL || process.env.KILO_BASE_URL || "https://api.kilo.ai/api/gateway",
    apiKey: process.env.KILO_API_KEY || "", // optional
    model: process.env.KILO_GATEWAY_MODEL || process.env.KILO_MODEL || "kilo-auto/free",
    headerAuth: "Authorization",
    headerPrefix: "Bearer "
  };
}

export async function chatCompletions({ messages, max_tokens = 1400, temperature = 0.2, extraHeaders = {} }) {
  const ep = getChatEndpoint();

  if (!ep.model) {
    throw new Error(`Missing model for backend '${getBackend()}'. Set env var NIM_MODEL or REQUESTY_MODEL etc.`);
  }

  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (ep.apiKey?.trim()) headers[ep.headerAuth] = `${ep.headerPrefix}${ep.apiKey.trim()}`;

  const url = `${ep.baseURL.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: ep.model, messages, max_tokens, temperature })
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${JSON.stringify(json)}`);

  return json?.choices?.[0]?.message?.content ?? "";
}
