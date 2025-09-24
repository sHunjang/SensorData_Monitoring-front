/**
 * 공통 HTTP 유틸
 * - BASE_URL: VITE_API_BASE 또는 localhost:8000
 * - fetchJSON: 에러/응답 파싱 표준화
 * - getErrorMessage: 에러 메시지 추출
 */
export const BASE_URL = import.meta.env?.VITE_API_BASE ?? "http://127.0.0.1:8000";
export async function fetchJSON(path, init) {
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
        return await res.json();
    }
    // fallback: try parse as json
    const txt = await res.text();
    try {
        return JSON.parse(txt);
    }
    catch {
        return txt;
    }
}
export function getErrorMessage(e) {
    if (!e)
        return "unknown error";
    if (e instanceof Error)
        return e.message;
    try {
        return String(e);
    }
    catch {
        return "unknown error";
    }
}
