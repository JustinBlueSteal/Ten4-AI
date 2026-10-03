import * as Location from "expo-location";
import type { OmhzSystem } from "../api/openmhz";

const STATES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

const norm = (s?: string) => (s ?? "").toLowerCase().replace(/\bcounty\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export interface Place { city: string; county: string; stateAbbr: string }

export async function getMyPlace(): Promise<Place> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== "granted") throw new Error("Location permission was denied. Use the search box instead.");
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const [addr] = await Location.reverseGeocodeAsync(pos.coords);
  if (!addr) throw new Error("Couldn't work out your city from your location.");
  const region = addr.region ?? "";
  return {
    city: addr.city ?? "",
    county: addr.subregion ?? "",
    stateAbbr: STATES[region] ?? (region.length === 2 ? region.toUpperCase() : ""),
  };
}

/** Rank feeds: same state is required when known; county/city text matches float to the top. */
export function systemsNear(systems: OmhzSystem[], place: Place): OmhzSystem[] {
  const city = norm(place.city);
  const county = norm(place.county);
  const scored = systems
    .map((s) => {
      if (place.stateAbbr && s.state && s.state.toUpperCase() !== place.stateAbbr) return { s, score: 0 };
      const hay = norm(`${s.name} ${s.city ?? ""} ${s.county ?? ""}`);
      let score = place.stateAbbr && s.state ? 1 : 0;
      if (county && hay.includes(county)) score += 4;
      if (city && hay.includes(city)) score += 3;
      return { s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.s);
}
