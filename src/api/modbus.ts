// src/api/modbus.ts
// - 레거시 함수(fetchRealtime/fetchTodayEnergy)도 /data/modbus/query로 우회
// - 신규 쿼리(fetchModbusQuery)는 그대로 유지(여기서는 예시로 최소 구현만 기재)

import { fetchJSON } from '@/lib/http';

export interface ModbusQueryParams {
    preset?: '1h' | '1d' | '1w' | '1mo';
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid?: number;
}

export interface ModbusDataPoint {
    bucket: string | null;
    totalactivepowerkw?: number | null;
    totalactiveenergykwh?: number | null;
    [key: string]: any;
}

export interface ModbusQueryResponse {
    data: ModbusDataPoint[];
    count?: number;
    preset?: string;
    device_id?: number;
    time_range?: { start: string; end: string };
    error?: string;
}

/** 신규 쿼리: /data/modbus/query */
export async function fetchModbusQuery(params: ModbusQueryParams = {}): Promise<ModbusQueryResponse> {
    const q = new URLSearchParams();
    q.set('preset', params.preset ?? '1h');
    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 336));
    if (params.deviceid != null) q.set('deviceid', String(params.deviceid));
    return await fetchJSON<ModbusQueryResponse>(`/data/modbus/query?${q.toString()}`);
}

/** 레거시 실시간: 내부적으로 1h 창의 마지막 포인트로 대체 */
export async function fetchRealtime(deviceId: number) {
    const q = new URLSearchParams({ deviceid: String(deviceId), preset: '1h', maxpoints: '1' });
    const json = await fetchJSON<ModbusQueryResponse>(`/data/modbus/query?${q.toString()}`);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const last = rows[rows.length - 1] ?? null;
    return {
        deviceid: deviceId,
        timestamp: last?.bucket ?? null,
        metrics: {
            pkw: last?.totalactivepowerkw ?? null,
            ekwh: last?.totalactiveenergykwh ?? null,
        },
        raw: last,
    };
}

/** 레거시 금일에너지: 내부적으로 1d 창의 누적 근사(최대-최소) */
export async function fetchTodayEnergy(deviceId: number) {
    const q = new URLSearchParams({ deviceid: String(deviceId), preset: '1d', maxpoints: '1440' });
    const json = await fetchJSON<ModbusQueryResponse>(`/data/modbus/query?${q.toString()}`);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const nums = rows.map(r => r?.totalactiveenergykwh).filter((v: any) => typeof v === 'number' && Number.isFinite(v)) as number[];
    const kwh = nums.length ? Number((Math.max(...nums) - Math.min(...nums)).toFixed(2)) : null;
    return { deviceid: deviceId, kwh, raw: rows };
}
