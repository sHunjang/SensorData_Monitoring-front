import { BASE_URL } from '@/lib/env';

export type DataRow = { bucket: string } & Record<string, number | null>;
export type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

export type ModbusRealtime = {
    time_stamp: string;
    device_id: number;
    avg_power_factor?: number | null;
    total_active_power_kW?: number | null;
    total_reactive_power_kvar?: number | null;
    total_apparent_power_kVA?: number | null;
    sum_line_currents_A?: number | null;
    avg_line_current_A?: number | null;
    avg_line_to_neutral_volts_V?: number | null;
    avg_line_to_line_volts_V?: number | null;
    total_active_energy_kwh?: number | null;
    total_reactive_energy_kvarh?: number | null;
    total_apparent_energy_kVAh?: number | null;
    phase_config?: '3P3W' | '3P4W';
};

export type ModbusQueryResp = {
    window: { start: string; end: string };
    bucket_seconds: number;
    limited: boolean;
    device_id: number;
    series: string[];
    data: DataRow[];
    stats: Record<string, Stat>;
};

export async function fetchRealtime(deviceId: number): Promise<ModbusRealtime | null> {
    const r = await fetch(`${BASE_URL}/data/modbus/realtime?device_id=${deviceId}`);
    if (!r.ok) return null;
    return r.json();
}

export async function fetchModbusQuery(params: {
    deviceId: number;
    series?: string[];
    preset?: '15m' | '1h' | '1d' | '1w' | '1mo';
    start?: string;
    end?: string;
    maxPoints?: number;
}): Promise<ModbusQueryResp | null> {
    const {
        deviceId,
        series = ['total_active_power_kW', 'total_reactive_power_kvar', 'total_apparent_power_kVA', 'avg_power_factor'],
        preset = '1d',
        start,
        end,
        maxPoints = 500,
    } = params;

    const url = new URL(`${BASE_URL}/data/modbus/query`);
    url.searchParams.set('device_id', String(deviceId));
    series.forEach((s) => url.searchParams.append('series', s));
    if (start) url.searchParams.set('start', start);
    if (end) url.searchParams.set('end', end);
    url.searchParams.set('preset', preset);
    url.searchParams.set('max_points', String(maxPoints));

    const r = await fetch(url.toString());
    if (!r.ok) return null;
    return r.json();
}

export async function fetchEnergyToday(deviceId: number) {
  const url = `${BASE_URL}/data/modbus/energy_today?device_id=${deviceId}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
}