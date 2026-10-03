import type { Dictionary } from "./lib/dictionary";
import type { OmhzSystem } from "./api/openmhz";

export interface Settings {
  backendUrl: string;
  language: string;
}
export type { Dictionary, OmhzSystem };
