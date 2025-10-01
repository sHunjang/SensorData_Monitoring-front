// src/api/env.ts
/**
 * 환경센서 API 클라이언트
 *
 * 주요 기능:
 * - fetchEnvQuery(): 온도/습도 시계열 데이터 조회
 * - 백엔드 env_router.py와 완벽 호환
 * - 방어적 파싱으로 안정성 보장
 * - 드릴다운 차트 지원을 위한 데이터 정규화
 *
 * 데이터 흐름:
 * 백엔드 API → fetchJSON → 데이터 정규화 → Container → Chart
 */
import { fetchJSON } from "@/lib/http";
/**
 * 환경센서 데이터 조회 함수
 *
 * @param params 조회 파라미터 (device_id, preset, max_points 등)
 * @returns 환경센서 데이터 및 통계 정보
 *
 * 사용 예시:
 * const result = await fetchEnvQuery({
 *   device_id: 21,
 *   preset: '1h',
 *   max_points: 300
 * });
 */
export async function fetchEnvQuery(params = {}) {
    // ============= URL 파라미터 생성 =============
    const q = new URLSearchParams();
    // 시간 범위 설정 (기본값: 1h)
    if (params.preset) {
        q.set("preset", params.preset);
    }
    // 시작/종료 시간 설정
    if (params.start) {
        q.set("start", params.start);
    }
    if (params.end) {
        q.set("end", params.end);
    }
    // 최대 데이터 포인트 수 (기본값: 500)
    q.set("max_points", String(params.max_points ?? 500));
    // 장치 ID 필터링 (env_router.py 지원)
    if (params.device_id != null) {
        q.set("device_id", String(params.device_id));
    }
    // ============= API 호출 =============
    const apiUrl = `/data/env/query?${q.toString()}`;
    console.log('🌿 환경센서 API 요청:', apiUrl);
    try {
        const json = await fetchJSON(apiUrl);
        console.log('🌿 환경센서 API 응답:', json);
        // ============= 응답 데이터 정규화 =============
        // 기본값으로 안전한 응답 구조 생성
        const response = {
            window: json?.window ?? null,
            bucket: json?.bucket ?? "1h",
            series: Array.isArray(json?.series) ? json.series : ["temperature", "humidity"],
            data: [],
            stats: json?.stats ?? {},
            error: json?.error ?? null,
        };
        // 데이터 배열 처리 및 정규화
        if (Array.isArray(json?.data)) {
            response.data = json.data.map((r) => ({
                // 시간 필드 (여러 필드명 지원)
                bucket: r.bucket ?? r.time_stamp ?? r.timestamp ?? null,
                // 온도 필드 (백엔드 env_router.py와 매칭)
                temperature: r.temperature ?? r.temp ?? r.temperature_c ?? null,
                // 습도 필드 (백엔드 env_router.py와 매칭)  
                humidity: r.humidity ?? r.hum ?? r.humidity_percent ?? null,
                // 장치 ID
                device_id: r.device_id ?? null,
            }));
        }
        // 🔍 데이터 검증 및 로깅
        console.log('🌿 정규화된 환경센서 데이터:', {
            dataPoints: response.data.length,
            hasTemperature: response.data.some(d => d.temperature !== null),
            hasHumidity: response.data.some(d => d.humidity !== null),
            timeRange: response.data.length > 0 ? {
                start: response.data[0]?.bucket,
                end: response.data[response.data.length - 1]?.bucket
            } : null
        });
        return response;
    }
    catch (error) {
        // ============= 에러 처리 =============
        console.error('🌿 환경센서 API 에러:', error);
        // 에러 시 기본 응답 반환 (UI 안정성 보장)
        return {
            window: null,
            bucket: "1h",
            series: ["temperature", "humidity"],
            data: [],
            stats: {},
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * 실시간 환경센서 데이터 조회 (간편 함수)
 *
 * @param deviceId 장치 ID
 * @returns 최근 15분간의 환경 데이터
 */
export async function fetchEnvRealtime(deviceId) {
    return fetchEnvQuery({
        device_id: deviceId,
        preset: '15m',
        max_points: 300
    });
}
/**
 * 환경센서 히스토리 데이터 조회 (간편 함수)
 *
 * @param deviceId 장치 ID
 * @param preset 시간 범위
 * @returns 지정된 기간의 환경 데이터
 */
export async function fetchEnvHistory(deviceId, preset) {
    return fetchEnvQuery({
        device_id: deviceId,
        preset,
        max_points: 2000
    });
}
