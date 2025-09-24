/**
 * solar API client
 * - fetchSolarQuery({preset,max_points,start,end})
 * - data entries: { bucket, solar, device_id? }
 */
import { fetchJSON } from "@/lib/http";
export async function fetchSolarQuery(params = {}) {
    const q = new URLSearchParams();
    if (params.preset)
        q.set("preset", params.preset);
    if (params.start)
        q.set("start", params.start);
    if (params.end)
        q.set("end", params.end);
    if (params.device_id != null)
        q.set("device_id", String(params.device_id));
    q.set("max_points", String(params.max_points ?? 500));
    const json = await fetchJSON(`/data/solar/query?${q.toString()}`);
    return {
        window: json?.window ?? null,
        bucket: json?.bucket ?? "1h",
        series: Array.isArray(json?.series) ? json.series : ["solar"],
        data: Array.isArray(json?.data) ? json.data.map((r) => ({
            bucket: r.bucket ?? r.time_stamp ?? r.timestamp ?? null,
            solar: r.solar ?? r.solar ?? null,
            device_id: r.device_id ?? null,
        })) : [],
        stats: json?.stats ?? { solar: { avg: null, max: null, min: null, count: 0 } },
        error: json?.error ?? null,
    };
}
