// scripts/llm_backend.mjs
// One OpenAI-compatible client for:
// - Kilo Gateway (https://api.kilo.ai/api/gateway)
// - NVIDIA NIM hosted (https://integrate.api.nvidia.com/v1)
// - Requesty router (https://router.requesty.ai/v1)

function norm(s) {
  return String(s || "").trim();
}

export function getBackend() {
  // REVIEW_BACKEND overrides COUNCIL_BACKEND for review-only scripts
  const b = norm(process.env.REVIEW_BACKEND || process.env.COUNCIL_BACKEND || "kilo-gateway").toLowerCase();
  return b;
}

export function resolveBackendConfig() {
  const b = getBackend();

  // auto: prefer requesty if configured, else nim if configured, else kilo-gateway
  if (b === "auto") {
    if (norm(process.env.REQUESTY_API_KEY)) return resolveBackendConfigFor("requesty");
    if (norm(process.env.NVIDIA_NIM_API_KEY)) return resolveBackendConfigFor("nim");
    return resolveBackendConfigFor("kilo-gateway");
  }

  return resolveBackendConfigFor(b);
}

function resolveBackendConfigFor(b) {
  if (b === "nim") {
    return {
      backend: "nim",
      baseURL: norm(process.env.NIM_BASE_URL) || "https://integrate.api.nvidia.com/v1",
      apiKey: norm(process.env.NVIDIA_NIM_API_KEY),
      model: norm(process.env.NIM_MODEL),
      supportsKiloModeHint: false
    };
  }

  if (b === "requesty") {
    return {
      backend: "requesty",
      baseURL: norm(process.env.REQUESTY_BASE_URL) || "https://router.requesty.ai/v1",
      apiKey: norm(process.env.REQUESTY_API_KEY),
      model: norm(process.env.REQUESTY_MODEL),
      supportsKiloModeHint: false
    };
  }

  // default: kilo-gateway
  return {
    backend: "kilo-gateway",
    baseURL: norm(process.env.KILO_BASE_URL) || "https://api.kilo.ai/api/gateway",
    apiKey: norm(process.env.KILO_API_KEY),
    model: norm(process.env.KILO_MODEL) || "kilo-auto/free",
    kiloModeHint: norm(process.env.KILO_MODE_HINT) || "debug",
    supportsKiloModeHint: true
  };
}

export async function chatCompletions({
  messages,
  max_tokens = 1400,
  temperature = 0.2,
  modelOverride = null,
  modeHint = null,
  extraHeaders = {}
}) {
  const cfg = resolveBackendConfig();
  const model = norm(modelOverride) || cfg.model;

  if (!model) {
    throw new Error(
      `Missing model for backend '${cfg.backend}'. ` +
      `Set NIM_MODEL / REQUESTY_MODEL / KILO_MODEL (or pass modelOverride).`
    );
  }

  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;

  // Only Kilo Gateway uses x-kilocode-mode
  if (cfg.supportsKiloModeHint) {
    const hint = norm(modeHint) || cfg.kiloModeHint;
    if (hint) headers["x-kilocode-mode"] = hint;
  }

  const url = `${cfg.baseURL.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, max_tokens, temperature })
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${JSON.stringify(json)}`);

  return {
    backend: cfg.backend,
    baseURL: cfg.baseURL,
    model,
    content: json?.choices?.[0]?.message?.content ?? "",
    raw: json
  };
}
