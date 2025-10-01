/**
 * src/lib/http.ts
 *
 * 공통 HTTP 유틸
 * - BASE_URL: 우선순위
 *     1) import.meta.env.VITE_API_BASE
 *     2) import.meta.env.VITE_API_BASE_URL
 *     3) fallback -> http://127.0.0.1:8000 (개발 편의)
 * - fetchJSON: 응답 상태/JSON 파싱을 표준화
 * - getErrorMessage: 에러 메시지 추출(방어적)
 *
 * 변경 이유:
 * - 프로젝트에 VITE_API_BASE와 VITE_API_BASE_URL이 섞여있음(vite-env.d.ts에 VITE_API_BASE_URL 선언 등).
 * - dev 환경에서 자동으로 API 경로가 맞지 않아 요청이 실패할 수 있으므로 둘 다 확인하도록 안전장치 추가.
 */
export const BASE_URL = import.meta.env?.VITE_API_BASE ??
    import.meta.env?.VITE_API_BASE_URL ??
    // 기본 폴백: 현재 호스트의 프로토콜+호스트 + 포트 8000 (로컬 개발 기본)
    `${window.location.protocol}//${window.location.hostname}:8000`;
/**
 * fetchJSON
 * - path: 절대 URL 또는 /data/... 같은 상대경로 허용
 * - init: fetch init 객체 그대로 전달
 * - 예외: non-ok 응답은 에러로 던짐 (본문 텍스트 포함)
 */
export async function fetchJSON(path, init) {
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    const res = await fetch(url, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
        return (await res.json());
    }
    // fallback: try parse as JSON, else return raw text
    const txt = await res.text();
    try {
        return JSON.parse(txt);
    }
    catch {
        return txt;
    }
}
/** getErrorMessage: 다양한 에러 타입에서 메시지 추출 */
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
