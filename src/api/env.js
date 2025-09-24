/**
 * env API client
 * - fetchEnvQuery({preset,max_points,start,end})
 * - 반환: { window,bucket,series,data,stats,error }
 * - data entries: { bucket: ISOstring, temperature, humidity, device_id? }
 */
import { fetchJSON } from "@/lib/http";
export async function fetchEnvQuery(params = {}) {
    const q = new URLSearchParams();
    if (params.preset)
        q.set("preset", params.preset);
    if (params.start)
        q.set("start", params.start);
    if (params.end)
        q.set("end", params.end);
    q.set("max_points", String(params.max_points ?? 500));
    if (params.device_id != null)
        q.set("device_id", String(params.device_id));
    const json = await fetchJSON(`/data/env/query?${q.toString()}`);
    return {
        window: json?.window ?? null,
        bucket: json?.bucket ?? "1h",
        series: Array.isArray(json?.series) ? json.series : ["temperature", "humidity"],
        data: Array.isArray(json?.data) ? json.data.map((r) => ({
            bucket: r.bucket ?? r.time_stamp ?? r.timestamp ?? null,
            temperature: r.temperature ?? r.temperature ?? null,
            humidity: r.humidity ?? r.humidity ?? null,
            device_id: r.device_id ?? null,
        })) : [],
        stats: json?.stats ?? {},
        error: json?.error ?? null,
    };
}
