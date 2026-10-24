# System prompt — 10-code / jargon interpretation

The live copy is `backend/src/pipeline/systemPrompt.ts` (keep both in sync).
It is sent to the LLM (Gemini free tier by default, or Ollama) with each Whisper transcript, plus:
the TARGET LANGUAGE (device language), the feed name, and the user's edited dictionary.

Key rules it enforces: output one JSON object only (`original_snippet`, `clean_translation`,
`urgency_level` LOW/MEDIUM/HIGH); `clean_translation` must show BOTH the spoken code and its plain-language
meaning together (e.g. "10-4 — Acknowledged"); never invent locations, names or outcomes; translate only,
no safety advice or commentary; prefer the user's dictionary over guesses; return `(unclear audio)` for garbage.

`backend/src/pipeline/extractJson.ts` does not trust the model to be tidy: it pulls the first balanced
`{...}` out of the reply (tolerating prose or code fences) and falls back to showing the raw transcript as the caption (urgency LOW) if parsing
fails, instead of crashing the pipeline.
