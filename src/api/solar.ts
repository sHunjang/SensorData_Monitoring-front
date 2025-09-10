import { BASE_URL } from "@/lib/env";

export type SolarResp = {
    window: { start: string; end: string };
    bucket_seconds: number;
    limited: boolean;
    series: ["solar"];
    data: Array<{ bucket: string; solar?: number | null }>;
    stats: { solar: { avg: number | null; max: number | null; min: number | null; count: number } };
};

export async function fetchSolarQuery(params: {
    preset?: "15m" | "1h" | "1d" | "1w" | "1mo";
    start?: string;
    end?: string;
    maxPoints?: number;
}): Promise<SolarResp | null> {
    const { preset = "1d", start, end, maxPoints = 500 } = params;
    const url = new URL(`${BASE_URL}/data/solar/query`);
    url.searchParams.set("preset", preset);
    if (start) url.searchParams.set("start", start);
    if (end) url.searchParams.set("end", end);
    url.searchParams.set("max_points", String(maxPoints));
    const r = await fetch(url.toString());
    if (!r.ok) return null;
    return r.json();
}
