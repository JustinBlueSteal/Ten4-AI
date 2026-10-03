import { arrayBufferToBase64 } from "../lib/base64";
import type { Dictionary } from "../lib/dictionary";
import type { Urgency } from "../theme";

export interface Caption {
  original_snippet: string;
  clean_translation: string;
  urgency_level: Urgency;
}

export class BackendError extends Error {
  constructor(message: string, public readonly status?: number, public readonly retryAfterSec?: number) {
    super(message);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function checkHealth(backendUrl: string): Promise<any> {
  const res = await fetchWithTimeout(`${backendUrl}/health`, {}, 6000);
  if (!res.ok) throw new BackendError(`Backend responded ${res.status}`, res.status);
  return res.json();
}

/** Download the call audio on the phone, then hand the bytes to the backend for transcription + translation. */
export async function captionCall(
  backendUrl: string,
  audioUrl: string,
  opts: { language: string; context: string; dictionary: Dictionary }
): Promise<Caption> {
  const audioRes = await fetchWithTimeout(audioUrl, {}, 30000);
  if (!audioRes.ok) throw new BackendError(`Audio download failed (${audioRes.status})`, audioRes.status);
  const audioBase64 = arrayBufferToBase64(await audioRes.arrayBuffer());

  const res = await fetchWithTimeout(
    `${backendUrl}/caption`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mime: "audio/mp4", ...opts }),
    },
    120000
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new BackendError(body?.error ?? `Backend responded ${res.status}`, res.status, body?.retryAfterSec);
  return body as Caption;
}
