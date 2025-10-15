// src/lib/http.ts
export const BASEURL =
    (import.meta as any).env?.VITE_API_BASE ??
    (import.meta as any).env?.VITE_API_BASE_URL ??
    `${window.location.protocol}//${window.location.hostname}:8000`;


/** 공용 JSON 요청 */
export async function fetchJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
    // 절대/상대 경로 정규화
    const raw = path.startsWith('http') ? path : `${BASEURL}${path}`;
    const url = new URL(raw);
    const sp = url.searchParams;


    // ✅ 파라미터 교정만 유지: device_id/max_points → deviceid/maxpoints
    if (sp.has('max_points') && !sp.has('maxpoints')) {
        sp.set('maxpoints', sp.get('max_points') as string);
        sp.delete('max_points');
    }
    if (sp.has('device_id') && !sp.has('deviceid')) {
        sp.set('deviceid', sp.get('device_id') as string);
        sp.delete('device_id');
    }


    // ❌ 경로 변환 로직 완전 제거!
    // if (url.pathname === '/data/modbus/realtime') { ... }
    // if (url.pathname === '/data/modbus/today') { ... }


    // 실제 요청 수행
    const res = await fetch(url.toString(), {
        ...init,
        headers: {
            accept: 'application/json',
            ...(init?.headers || {}),
        },
    });


    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
    }


    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
        return (await res.json()) as T;
    }


    const txt = await res.text();
    try {
        return JSON.parse(txt) as T;
    } catch {
        return txt as unknown as T;
    }
}


/** 에러 안전 문자열화 */
export function getErrorMessage(e: unknown): string {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message;
    try {
        return String(e);
    } catch {
        return 'Unknown error';
    }
}
