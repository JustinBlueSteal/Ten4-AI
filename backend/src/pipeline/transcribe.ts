import { config } from "../config.js";

/** Send audio to the self-hosted whisper-asr-webservice. It runs its own ffmpeg, so m4a/mp3/wav all work. */
export async function transcribe(audio: Buffer, mime: string): Promise<string> {
  const form = new FormData();
  form.append("audio_file", new Blob([new Uint8Array(audio)], { type: mime }), "call.m4a");
  const url = `${config.whisperUrl}/asr?task=transcribe&language=en&output=json&encode=true`;
  const res = await fetch(url, { method: "POST", body: form, signal: AbortSignal.timeout(config.whisperTimeoutMs) });
  if (!res.ok) {
    throw new Error(`Whisper HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
