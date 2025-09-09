// src/api/env.ts
import { BASE_URL } from '@/lib/env';
export type EnvResp = {
    window: { start: string; end: string }; bucket_seconds: number; limited: boolean; series: string[];
    data: Array<{ bucket: string; temperature?: number | null; humidity?: number | null }>;
    stats: Record<string, { avg: number | null; max: number | null; min: number | null; count: number }>;
};
export async function fetchEnvQuery(params: { preset?: '15m' | '1h' | '1d' | '1w' | '1mo'; start?: string; end?: string; maxPoints?: number; }): Promise<EnvResp | null> {
    const { preset = '1d', start, end, maxPoints = 500 } = params;
    const url = new URL(`${BASE_URL}/data/env/query`); url.searchParams.set('preset', preset);
    if (start) url.searchParams.set('start', start); if (end) url.searchParams.set('end', end);
    url.searchParams.set('max_points', String(maxPoints));
    const r = await fetch(url.toString()); if (!r.ok) return null; return r.json();
}
