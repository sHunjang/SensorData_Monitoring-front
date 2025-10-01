// src/api/env.ts
// - /data/env/query 전용 래퍼
// - deviceid(필수) + maxpoints + preset(1h/1d/1w/1mo)만 사용

import { fetchJSON } from '@/lib/http';

export interface EnvQueryParams {
    preset?: '1h' | '1d' | '1w' | '1mo';
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid: number; // 서버가 필수로 요구
}

export interface EnvDataPoint {
    bucket: string | null;
    temperature: number | null;
    humidity: number | null;
    device_id?: number | null;
}

export interface EnvQueryResponse {
    data: EnvDataPoint[];
    count?: number;
    preset?: string;
    device_id?: number;
    time_range?: { start: string; end: string };
    error?: string;
}

export async function fetchEnvQuery(params: EnvQueryParams): Promise<EnvQueryResponse> {
    const q = new URLSearchParams();
    q.set('preset', params.preset ?? '1h');
    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 336));
    q.set('deviceid', String(params.deviceid));
    return await fetchJSON<EnvQueryResponse>(`/data/env/query?${q.toString()}`);
}
