/**
 * OpenMHz public API, called from the PHONE (the backend is blocked with HTTP 403).
 * Field names are parsed tolerantly because this API is undocumented; if the app shows
 * "OpenMHz responded 403/…", that is milestone M7's evidence either way.
 */
const BASE = "https://api.openmhz.com";

export interface OmhzSystem { shortName: string; name: string; city?: string; state?: string; county?: string }
export interface OmhzCall { id: string; url: string; time: number; talkgroup?: number; len?: number }

export class OpenMhzError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function getJson(path: string): Promise<any> {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new OpenMhzError(res.status, `OpenMHz responded ${res.status} for ${path}`);
  return res.json();
}

export async function listSystems(): Promise<OmhzSystem[]> {
  const data = await getJson("/systems");
  const arr: any[] = Array.isArray(data) ? data : data?.systems ?? [];
  return arr
    .filter((s) => s && typeof s.shortName === "string")
    .map((s) => ({
      shortName: s.shortName,
      name: String(s.name ?? s.shortName),
      city: s.city ? String(s.city) : undefined,
      state: s.state ? String(s.state) : undefined,
      county: s.county ? String(s.county) : undefined,
    }));
}

function toCall(c: any): OmhzCall | null {
  if (!c || typeof c.url !== "string") return null;
  const t = typeof c.time === "number" ? c.time : Date.parse(String(c.time));
  return {
    id: String(c._id ?? c.id ?? c.url),
    url: c.url,
    time: Number.isFinite(t) ? t : Date.now(),
    talkgroup: typeof c.talkgroupNum === "number" ? c.talkgroupNum : undefined,
    len: typeof c.len === "number" ? c.len : undefined,
  };
}

function parseCalls(data: any): OmhzCall[] {
  const arr: any[] = Array.isArray(data) ? data : data?.calls ?? [];
  return arr.map(toCall).filter((c): c is OmhzCall => c !== null).sort((a, b) => a.time - b.time);
}

/** Most recent calls for a system, oldest first. */
export async function latestCalls(shortName: string): Promise<OmhzCall[]> {
  return parseCalls(await getJson(`/${encodeURIComponent(shortName)}/calls`));
}

/** Calls newer than the given epoch-ms timestamp, oldest first. */
export async function callsNewerThan(shortName: string, time: number): Promise<OmhzCall[]> {
  return parseCalls(await getJson(`/${encodeURIComponent(shortName)}/calls/newer?time=${time}`));
}
