export const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
export const PRESETS = ["15m", "1h", "6h", "12h", "1d", "3d", "7d", "30d"] as const;
export type Preset = (typeof PRESETS)[number];
