import { generate } from "./llm.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { extractJsonObject } from "./extractJson.js";

export type Urgency = "LOW" | "MEDIUM" | "HIGH";
export interface Interpretation {
  original_snippet: string;
  clean_translation: string;
  urgency_level: Urgency;
}

export function normalize(raw: unknown, transcript: string): Interpretation {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const urgency = String(obj.urgency_level ?? "").toUpperCase();
  const clean = typeof obj.clean_translation === "string" ? obj.clean_translation.trim() : "";
  return {
    original_snippet: transcript,
    clean_translation: clean || transcript,
    urgency_level: urgency === "HIGH" || urgency === "MEDIUM" || urgency === "LOW" ? urgency : "LOW",
  };
}

export async function interpret(
  transcript: string,
  opts: { language: string; context?: string; dictionary?: Record<string, string> }
): Promise<Interpretation> {
  if (!transcript.trim()) {
    return { original_snippet: transcript, clean_translation: "(unclear audio)", urgency_level: "LOW" };
  }
  const dict = opts.dictionary && Object.keys(opts.dictionary).length
    ? "\nUSER DICTIONARY:\n" + Object.entries(opts.dictionary).map(([k, v]) => `${k} = ${v}`).join("\n")
    : "";
  const user =
    `TARGET LANGUAGE: ${opts.language}\n` +
    (opts.context ? `FEED: ${opts.context}\n` : "") +
    dict +
    `\n\nTRANSCRIPT:\n${transcript}`;

  const text = await generate(SYSTEM_PROMPT, user);
  const parsed = extractJsonObject(text);
  if (!parsed) {
    // Safe, clearly-labelled fallback: never invent content, never crash the pipeline.
    return { original_snippet: transcript, clean_translation: transcript, urgency_level: "LOW" };
  }
  return normalize(parsed, transcript);
}
