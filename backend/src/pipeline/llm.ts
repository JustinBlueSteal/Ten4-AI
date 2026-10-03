import { config } from "../config.js";

export class LlmError extends Error {
  constructor(message: string, public readonly status?: number, public readonly retryAfterSec?: number) {
    super(message);
  }
}

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.llmTimeoutMs),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    const retry = Number(res.headers.get("retry-after"));
    throw new LlmError(`LLM HTTP ${res.status}: ${detail}`, res.status, Number.isFinite(retry) ? retry : undefined);
  }
  return res.json() as Promise<any>;
}

/** Returns the model's raw text reply. The caller is responsible for JSON extraction. */
export async function generate(system: string, user: string): Promise<string> {
  if (config.llmProvider === "ollama") {
    const data = await postJson(
      `${config.ollamaUrl}/api/chat`,
      {
        model: config.ollamaModel,
        stream: false,
        format: "json",
        options: { temperature: 0.1 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      {}
    );
    return String(data?.message?.content ?? "");
  }

  if (!config.geminiKey) {
    throw new LlmError("GEMINI_API_KEY is not set in backend/.env (free key: https://aistudio.google.com/apikey)");
  }
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`,
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    },
    { "x-goog-api-key": config.geminiKey }
  );
  const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}
