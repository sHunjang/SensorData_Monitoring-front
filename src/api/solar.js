// src/api/solar.ts
/**
 * 태양광 센서 API 클라이언트 - 백엔드 호환성 보장
 *
 * 주요 기능:
 * - fetchSolarQuery(): 일사량 시계열 데이터 조회
 * - 백엔드 solar_router.py와 완벽 호환
 * - 방어적 파싱으로 안정성 보장
 * - 드릴다운 차트 지원을 위한 데이터 정규화
 *
 * 측정 데이터:
 * - solar: 일사량 (W/m²) - 백엔드 API 호환 필드명
 * - device_id: 태양광 센서 장치 ID
 */
import { fetchJSON } from "@/lib/http";
/**
 * 일사량 시계열 데이터 조회
 *
 * @param params 조회 파라미터
 * @returns 일사량 데이터 및 통계
 */
export async function fetchSolarQuery(params) {
    const queryParams = new URLSearchParams();
    // 파라미터 설정
    if (params.preset)
        queryParams.set('preset', params.preset);
    if (params.start)
        queryParams.set('start', params.start);
    if (params.end)
        queryParams.set('end', params.end);
    if (params.max_points)
        queryParams.set('max_points', params.max_points.toString());
    if (params.device_id)
        queryParams.set('device_id', params.device_id.toString());
    const url = `/data/solar/query?${queryParams.toString()}`;
    try {
        const response = await fetchJSON(url);
        // ✅ 백엔드 응답을 그대로 사용 (변환 불필요)
        // 백엔드에서 이미 solar 필드로 응답하므로 데이터 변환 제거
        // 방어적 파싱 - 기본값 설정
        if (!response.stats) {
            response.stats = {};
        }
        if (!response.stats.solar) {
            response.stats.solar = {
                avg: null,
                max: null,
                min: null,
                count: 0
            };
        }
        return response;
    }
    catch (error) {
        console.error('fetchSolarQuery failed:', error);
        // 에러 시 기본 응답 반환
        return {
            window_start: null,
            window_end: null,
            bucket_label: "1 hour",
            series: ["solar"], // ✅ 백엔드 API 호환
            data: [],
            stats: {
                solar: { avg: null, max: null, min: null, count: 0 } // ✅ 백엔드 API 호환
            },
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * 최신 일사량 데이터 조회 (실시간)
 *
 * @param deviceId 특정 장치 ID (선택적)
 * @returns 실시간 일사량 데이터
 */
export async function fetchSolarRealtime(deviceId) {
    const queryParams = new URLSearchParams();
    if (deviceId)
        queryParams.set('device_id', deviceId.toString());
    const url = `/data/solar/realtime?${queryParams.toString()}`;
    try {
        const response = await fetchJSON(url);
        // 방어적 파싱
        if (!response.data) {
            response.data = {};
        }
        return response;
    }
    catch (error) {
        console.error('fetchSolarRealtime failed:', error);
        return {
            timestamp: null,
            data: {},
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * 일사량 데이터 검증 함수
 */
export function isValidSolar(value) {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
}
/**
 * 일사량 단위 변환 헬퍼
 */
export const SOLAR_UNITS = {
    W_PER_M2: 'W/m²',
    KW_PER_M2: 'kW/m²',
};
/**
 * 일사량 값을 포맷팅
 */
export function formatSolar(value, unit = 'W_PER_M2') {
    if (value === null || value === undefined)
        return '-';
    switch (unit) {
        case 'W_PER_M2':
            return `${value.toFixed(1)} ${SOLAR_UNITS.W_PER_M2}`;
        case 'KW_PER_M2':
            return `${(value / 1000).toFixed(3)} ${SOLAR_UNITS.KW_PER_M2}`;
        default:
            return `${value.toFixed(1)} W/m²`;
    }
}
// ✅ 기존 코드와의 호환성을 위한 별칭
export const isValidIrradiance = isValidSolar;
export const IRRADIANCE_UNITS = SOLAR_UNITS;
export const formatIrradiance = formatSolar;
