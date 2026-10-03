export const colors = {
  bg: "#0B1220",
  panel: "#131D31",
  border: "#22304D",
  text: "#E8EEFB",
  muted: "#8EA0C4",
  accent: "#4C8DFF",
  low: "#5F7BA8",
  medium: "#F2A93B",
  high: "#FF5A5F",
  ok: "#3DDC97",
};
export type Urgency = "LOW" | "MEDIUM" | "HIGH";
export const urgencyColor: Record<Urgency, string> = {
  LOW: colors.low,
  MEDIUM: colors.medium,
  HIGH: colors.high,
};
