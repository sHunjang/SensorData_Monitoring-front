// src/api/modbus.ts
import { BASE_URL } from '@/lib/env';
export type DataRow = { bucket: string } & Record<string, number | null>;
export type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
export type ModbusRealtime = { time_stamp: string; device_id: number; total_active_power_kW?: number | null; voltage?: number | null; phase_config?: '3P3W' | '3P4W'; };
export type ModbusQueryResp = { window: { start: string; end: string }; bucket_seconds: number; limited: boolean; device_id: number; series: string[]; data: DataRow[]; stats: Record<string, Stat>; };

export async function fetchRealtime(deviceId: number): Promise<ModbusRealtime | null> {
    const r = await fetch(`${BASE_URL}/data/modbus/realtime?device_id=${deviceId}`); if (!r.ok) return null; return r.json();
}
export async function fetchModbusQuery(params: { deviceId: number; series?: string[]; preset?: '15m' | '1h' | '1d' | '1w' | '1mo'; start?: string; end?: string; maxPoints?: number; }): Promise<ModbusQueryResp | null> {
    const { deviceId, series = ['p_total', 'voltage', 'current'], preset = '1d', start, end, maxPoints = 500 } = params;
    const url = new URL(`${BASE_URL}/data/modbus/query`);
    url.searchParams.set('device_id', String(deviceId));
    series.forEach(s => url.searchParams.append('series', s));
    if (start) url.searchParams.set('start', start); if (end) url.searchParams.set('end', end);
    url.searchParams.set('preset', preset); url.searchParams.set('max_points', String(maxPoints));
    const r = await fetch(url.toString()); if (!r.ok) return null; return r.json();
}
