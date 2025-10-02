// src/lib/http.ts
// - 전역 HTTP 유틸 + 레거시 호환 리라이트
// - 효과: /data/modbus/realtime|today, device_id/max_points, preset=15m 이 남아 있어도
//         런타임에서 /data/*/query + deviceid/maxpoints + 표준 preset(1h/1d)로 자동 교정

export const BASEURL =
    (import.meta as any).env?.VITE_API_BASE ??
    (import.meta as any).env?.VITE_API_BASE_URL ??
    `${window.location.protocol}//${window.location.hostname}:8000`;

/** 공용 JSON 요청 + 레거시 → 신규 규격 리라이트 */
export async function fetchJSON<T = any>(path: string, init?: RequestInit): Promise<T> {
    // 절대/상대 경로 정규화
    const raw = path.startsWith('http') ? path : `${BASEURL}${path}`;
    const url = new URL(raw);
    const sp = url.searchParams;

    // 1) 파라미터 교정: device_id/max_points → deviceid/maxpoints, 15m → 1h
    if (sp.has('max_points') && !sp.has('maxpoints')) {
        sp.set('maxpoints', sp.get('max_points') as string);
        sp.delete('max_points');
    }
    if (sp.has('device_id') && !sp.has('deviceid')) {
        sp.set('deviceid', sp.get('device_id') as string);
        sp.delete('device_id');
    }
    if (sp.get('preset') === '15m') {
        sp.set('preset', '1h');
    }

    // 2) Modbus 레거시 경로 교정: /realtime|/today → /query
    if (url.pathname === '/data/modbus/realtime') {
        url.pathname = '/data/modbus/query';
        if (!sp.has('preset')) sp.set('preset', '1h');
        if (!sp.has('maxpoints')) sp.set('maxpoints', '60');
    }
    if (url.pathname === '/data/modbus/today') {
        url.pathname = '/data/modbus/query';
        if (!sp.has('preset')) sp.set('preset', '1d');
        if (!sp.has('maxpoints')) sp.set('maxpoints', '1440');
    }

    // 3) 실제 요청 수행
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
