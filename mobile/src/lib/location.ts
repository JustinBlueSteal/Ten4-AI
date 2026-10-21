import * as Location from "expo-location";
import type { OmhzSystem } from "../api/openmhz";

export interface Place {
  latitude: number;
  longitude: number;
  city?: string;
  county?: string;
  stateAbbr?: string;
  stateName?: string;
}

const STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATES).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

/** Accepts "CA", "ca", "California", "US-CA"; returns the 2-letter code or undefined. */
export function toStateAbbr(value?: string | null): string | undefined {
  if (!value) return undefined;
  let v = value.trim();
  if (/^US-/i.test(v)) v = v.slice(3);
  const upper = v.toUpperCase();
  if (upper.length === 2 && STATES[upper]) return upper;
  return NAME_TO_ABBR[v.toLowerCase()];
}

function norm(value?: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(county|parish|borough|municipality|city and borough of|city of|town of)\b/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function fixPosition(): Promise<{ latitude: number; longitude: number }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== "granted") {
    throw new Error(
      "Location permission is off for this app. Open your phone's Settings, find Expo Go (or Ten4 Text), set Location to \"While Using\", then try again."
    );
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error("Location Services are turned off on this phone. Turn them on in Settings, then try again.");
  }
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000, requiredAccuracy: 5000 });
    if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  } catch {
    // fall through to a fresh fix
  }
  const pos = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    20_000,
    "Couldn't get a GPS fix in time. Move near a window or check Location Services, then try again."
  );
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

/** Keyless fallback (OpenStreetMap Nominatim) for when the on-device geocoder returns nothing useful. */
async function nominatim(latitude: number, longitude: number): Promise<Partial<Place>> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=12` +
    `&lat=${latitude}&lon=${longitude}`;
  const res = await withTimeout(
    fetch(url, { headers: { Accept: "application/json", "User-Agent": "Ten4Text/0.1 (mobile app)" } }),
    8000,
    "Reverse lookup timed out"
  );
  if (!res.ok) throw new Error(`Reverse lookup failed (${res.status})`);
  const data: any = await res.json();
  const a = data?.address ?? {};
  const iso: string | undefined = a["ISO3166-2-lvl4"];
  return {
    city: a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb,
    county: a.county,
    stateAbbr: toStateAbbr(iso) ?? toStateAbbr(a.state),
    stateName: a.state,
  };
}

/** Where the user is: coordinates plus city / county / state. Throws a plain-English message on failure. */
export async function getMyPlace(): Promise<Place> {
  const { latitude, longitude } = await fixPosition();
  const place: Place = { latitude, longitude };

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const r = results[0];
    if (r) {
      place.city = r.city ?? r.district ?? undefined;
      place.county = r.subregion ?? undefined;
      place.stateName = r.region ?? undefined;
      place.stateAbbr = toStateAbbr(r.region);
    }
  } catch {
    // device geocoder unavailable; the fallback below covers it
  }

  if (!place.stateAbbr || !place.county || !place.city) {
    try {
      const n = await nominatim(latitude, longitude);
      place.city = place.city ?? n.city;
      place.county = place.county ?? n.county;
      place.stateAbbr = place.stateAbbr ?? n.stateAbbr;
      place.stateName = place.stateName ?? n.stateName;
    } catch {
      // keep whatever the device geocoder gave us
    }
  }

  if (!place.stateAbbr) {
    throw new Error("Got your location but couldn't work out your state. Check your connection and try again, or use the search box.");
  }
  return place;
}

/**
 * Systems ranked by how local they are to `place`: county / city matches first, then other
 * feeds in the same state. Returns [] only when the state is unknown or no feed is in it.
 */
export function systemsNear(systems: OmhzSystem[], place: Place): OmhzSystem[] {
  if (!place.stateAbbr) return [];
  const city = norm(place.city);
  const county = norm(place.county);

  const scored: { s: OmhzSystem; score: number }[] = [];
  for (const s of systems) {
    const sState = toStateAbbr(s.state);
    if (sState && sState !== place.stateAbbr) continue;

    let score = sState ? 5 : 0;
    const sCity = norm(s.city);
    const sCounty = norm(s.county);
    const sName = norm(s.name);

    if (county && sCounty && sCounty === county) score += 50;
    if (city && sCity && sCity === city) score += 40;
    if (city && sName.includes(city)) score += 25;
    if (county && sName.includes(county)) score += 20;
    if (!sCity && !sCounty && sState) score += 3; // statewide systems

    if (score > 0) scored.push({ s, score });
  }
  scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name));
  return scored.map((x) => x.s);
}

/** True when the top results are genuinely local, not just "same state". */
export function hasLocalMatch(systems: OmhzSystem[], place: Place): boolean {
  const city = norm(place.city);
  const county = norm(place.county);
  return systems.some((s) => {
    const sCity = norm(s.city);
    const sCounty = norm(s.county);
    return (!!county && sCounty === county) || (!!city && (sCity === city || norm(s.name).includes(city)));
  });
}
