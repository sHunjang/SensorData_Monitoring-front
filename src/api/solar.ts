// src/api/solar.ts
// - /data/solar/query 전용 래퍼
// - deviceid(필수) + maxpoints + preset(1h/1d/1w/1mo)

import { fetchJSON } from '@/lib/http';

export interface SolarQueryParams {
    preset?: '10s' | '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid: number; // 서버가 필수로 요구
}

export interface SolarDataPoint {
    bucket: string | null;
    irradiance: number | null; // W/m²
}

export interface SolarQueryResponse {
    data: SolarDataPoint[];
    count?: number;
    preset?: string;
    device_id?: number;
    time_range?: { start: string; end: string };
    error?: string;
}

export async function fetchSolarQuery(params: SolarQueryParams): Promise<SolarQueryResponse> {
    const q = new URLSearchParams();
    q.set('preset', params.preset ?? '1m');
    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 336));
    q.set('deviceid', String(params.deviceid));
    return await fetchJSON<SolarQueryResponse>(`/data/solar/query?${q.toString()}`);
}
