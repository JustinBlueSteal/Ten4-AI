import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { transcribe } from "./pipeline/transcribe.js";
import { interpret } from "./pipeline/interpret.js";
import { SerialQueue } from "./pipeline/queue.js";
import { LlmError } from "./pipeline/llm.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const queue = new SerialQueue(config.llmMinIntervalMs);

app.get("/health", async (_req, res) => {
  let whisper = false;
  try {
    const r = await fetch(`${config.whisperUrl}/docs`, { signal: AbortSignal.timeout(3000) });
    whisper = r.ok;
  } catch {
    whisper = false;
  }
  res.json({
    ok: true,
    whisper,
    llmProvider: config.llmProvider,
    llmConfigured: config.llmProvider === "ollama" || Boolean(config.geminiKey),
    queueDepth: queue.depth,
  });
});

/**
 * POST /caption
 * { audioBase64: string, mime?: string, language?: string, context?: string, dictionary?: {code: meaning} }
 * The mobile app downloads the OpenMHz audio itself (the backend is blocked by OpenMHz with HTTP 403)
 * and hands the bytes over. Returns { original_snippet, clean_translation, urgency_level }.
 */
app.post("/caption", async (req, res) => {
  const { audioBase64, mime, language, context, dictionary } = req.body ?? {};
  if (typeof audioBase64 !== "string" || audioBase64.length < 100) {
    res.status(400).json({ error: "audioBase64 is required" });
    return;
  }
  const audio = Buffer.from(audioBase64, "base64");
  try {
    const result = await queue.run(async () => {
      const transcript = await transcribe(audio, typeof mime === "string" ? mime : "audio/mp4");
      return interpret(transcript, {
        language: typeof language === "string" && language ? language : "English",
        context: typeof context === "string" ? context : undefined,
        dictionary: dictionary && typeof dictionary === "object" ? dictionary : undefined,
      });
    });
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[caption] failed:", msg);
    if (msg === "QUEUE_FULL") {
      res.status(429).json({ error: "Caption queue is full; skipping this call", retryAfterSec: 10 });
    } else if (err instanceof LlmError && err.status === 429) {
      res.status(429).json({ error: "LLM free-tier rate limit hit", retryAfterSec: err.retryAfterSec ?? 30 });
    } else {
      res.status(502).json({ error: msg });
    }
  }
});

app.listen(config.port, () => {
  console.log(`Ten4 Text backend on :${config.port}  (LLM: ${config.llmProvider})`);
});
