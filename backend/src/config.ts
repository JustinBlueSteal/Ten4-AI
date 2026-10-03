import "dotenv/config";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: num("PORT", 4000),
  whisperUrl: (process.env.WHISPER_ASR_URL ?? "http://localhost:9000").replace(/\/$/, ""),
  llmProvider: (process.env.LLM_PROVIDER ?? "gemini") as "gemini" | "ollama",
  geminiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  ollamaUrl: (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.1",
  llmMinIntervalMs: num("LLM_MIN_INTERVAL_MS", 7000),
  whisperTimeoutMs: num("WHISPER_TIMEOUT_MS", 60000),
  llmTimeoutMs: num("LLM_TIMEOUT_MS", 30000),
};
