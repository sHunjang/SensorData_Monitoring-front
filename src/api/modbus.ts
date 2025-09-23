/**
 * modbus API client
 * - fetchRealtime(deviceId) -> { device_id, time_stamp, metrics:{p_kw,e_kwh,...}, raw }
 * - fetchModbusQuery(params) -> { window,bucket,series,data,stats,error }
 * - fetchTodayEnergy(deviceId) -> { device_id, kwh, raw }
 *
 * 방어적 파싱: 응답 스펙이 달라도 null로 보정해서 컴포넌트가 깨지지 않게 함.
 */
import { fetchJSON } from "@/lib/http";

export type RealtimeResp = {
    device_id: number;
    time_stamp: string | null;
    metrics: { p_kw: number | null; e_kwh: number | null; v_avg?: number | null; i_sum?: number | null; pf?: number | null };
    raw?: any;
};

export async function fetchRealtime(deviceId: number): Promise<RealtimeResp> {
    const json = await fetchJSON<any>(`/data/modbus/realtime?device_id=${deviceId}`);
    const raw = json?.data ?? json ?? {};
    const metricsSrc = raw?.metrics ?? raw?.raw_metrics ?? raw;
    const p_kw = metricsSrc?.p_kw ?? metricsSrc?.power_kw ?? metricsSrc?.power ?? null;
    const e_kwh = metricsSrc?.e_kwh ?? metricsSrc?.energy_kwh ?? metricsSrc?.e ?? null;
    const v_avg = metricsSrc?.v_avg ?? metricsSrc?.voltage_avg ?? null;
    const i_sum = metricsSrc?.i_sum ?? metricsSrc?.current_sum ?? null;
    const pf = metricsSrc?.pf ?? metricsSrc?.power_factor ?? null;

    return {
        device_id: Number(raw?.device_id ?? deviceId),
        time_stamp: raw?.time_stamp ?? raw?.timestamp ?? null,
        metrics: { p_kw: p_kw ?? null, e_kwh: e_kwh ?? null, v_avg: v_avg ?? null, i_sum: i_sum ?? null, pf: pf ?? null },
        raw,
    };
}

export async function fetchModbusQuery(params: { device_id: number; series?: string[]; preset?: string; start?: string; end?: string; max_points?: number }) {
    const q = new URLSearchParams();
    q.set("device_id", String(params.device_id));
    if (params.series) q.set("series", params.series.join(","));
    if (params.preset) q.set("preset", params.preset);
    if (params.start) q.set("start", params.start);
    if (params.end) q.set("end", params.end);
    if (params.max_points) q.set("max_points", String(params.max_points ?? 500));
    const json = await fetchJSON<any>(`/data/modbus/query?${q.toString()}`);
    return {
        window: json?.window ?? null,
        bucket: json?.bucket ?? "1h",
        series: Array.isArray(json?.series) ? json.series : (params.series ?? []),
        data: Array.isArray(json?.data) ? json.data : [],
        stats: json?.stats ?? {},
        error: json?.error ?? null,
    };
}

export async function fetchTodayEnergy(deviceId: number) {
    const json = await fetchJSON<any>(`/data/modbus/today?device_id=${deviceId}`);
    return { device_id: Number(json?.device_id ?? deviceId), kwh: json?.kwh ?? null, raw: json };
}
