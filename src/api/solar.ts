// src/api/solar.ts

/**
 * 태양광 센서 API 클라이언트
 * 
 * 주요 기능:
 * - fetchSolarQuery(): 일사량 시계열 데이터 조회
 * - 백엔드 solar_router.py와 완벽 호환
 * - 방어적 파싱으로 안정성 보장
 * - 드릴다운 차트 지원을 위한 데이터 정규화
 * 
 * 측정 데이터:
 * - irradiance: 일사량 (W/m²)
 * - device_id: 태양광 센서 장치 ID
 */

import { fetchJSON } from "@/lib/http";

/**
 * 태양광 조회 파라미터 타입
 */
export interface SolarQueryParams {
    preset?: string;         // 시간 범위 ('15m', '1h', '1d', '1w', '1mo')
    max_points?: number;     // 최대 데이터 포인트 수
    start?: string;         // 시작 시간 (ISO 문자열)
    end?: string;           // 종료 시간 (ISO 문자열)
    device_id?: number;     // 장치 ID (31, 32, 33 등)
}

/**
 * 태양광 데이터 포인트 타입
 */
export interface SolarDataPoint {
    bucket: string | null;             // KST 타임스탬프 (ISO 문자열)
    solar: number | null;              // 일사량 (W/m²) - 레거시 필드명
    irradiance_w_per_m2?: number | null; // 일사량 (W/m²) - 새 필드명
    device_id: number | null;          // 장치 ID
}

/**
 * 태양광 통계 정보 타입
 */
export interface SolarStats {
    solar?: {
        avg: number | null;
        max: number | null;
        min: number | null;
        count: number;
    };
    irradiance?: {
        avg: number | null;
        max: number | null;
        min: number | null;
        count: number;
    };
}

/**
 * 태양광 API 응답 타입
 */
export interface SolarQueryResponse {
    window: any;                    // 시간 윈도우 정보
    bucket: string;                 // 버킷 크기 ('1h', '15m' 등)
    series: string[];              // 데이터 시리즈 목록
    data: SolarDataPoint[];        // 실제 측정 데이터
    stats: SolarStats;             // 통계 정보
    error: string | null;          // 에러 메시지
}

/**
 * 태양광 센서 데이터 조회 함수
 * 
 * @param params 조회 파라미터 (device_id, preset, max_points 등)
 * @returns 태양광 데이터 및 통계 정보
 * 
 * 사용 예시:
 * const result = await fetchSolarQuery({ 
 *   device_id: 31, 
 *   preset: '1d', 
 *   max_points: 500 
 * });
 */
export async function fetchSolarQuery(params: SolarQueryParams = {}): Promise<SolarQueryResponse> {
    // ============= URL 파라미터 생성 =============

    const q = new URLSearchParams();

    // 시간 범위 설정
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

    // 장치 ID 필터링 (solar_router.py 지원)
    if (params.device_id != null) {
        q.set("device_id", String(params.device_id));
    }

    // 최대 데이터 포인트 수 (기본값: 500)
    q.set("max_points", String(params.max_points ?? 500));

    // ============= API 호출 =============

    const apiUrl = `/data/solar/query?${q.toString()}`;
    console.log('☀️ 태양광 API 요청:', apiUrl);

    try {
        const json = await fetchJSON(apiUrl);
        console.log('☀️ 태양광 API 응답:', json);

        // ============= 응답 데이터 정규화 =============

        // 기본값으로 안전한 응답 구조 생성
        const response: SolarQueryResponse = {
            window: json?.window ?? null,
            bucket: json?.bucket ?? "1h",
            series: Array.isArray(json?.series) ? json.series : ["solar", "irradiance"],
            data: [],
            stats: json?.stats ?? { solar: { avg: null, max: null, min: null, count: 0 } },
            error: json?.error ?? null,
        };

        // 데이터 배열 처리 및 정규화
        if (Array.isArray(json?.data)) {
            response.data = json.data.map((r: any) => {
                // 일사량 값 추출 (여러 필드명 지원)
                const solarValue = r.solar ?? r.irradiance ?? r.irradiance_w_per_m2 ?? r.value ?? null;

                return {
                    // 시간 필드 (여러 필드명 지원)
                    bucket: r.bucket ?? r.time_stamp ?? r.timestamp ?? null,

                    // 일사량 필드 (레거시 호환성)
                    solar: solarValue,

                    // 일사량 필드 (새 명명 규칙)
                    irradiance_w_per_m2: solarValue,

                    // 장치 ID
                    device_id: r.device_id ?? null,
                };
            }) as SolarDataPoint[];
        }

        // 🔍 데이터 검증 및 로깅
        console.log('☀️ 정규화된 태양광 데이터:', {
            dataPoints: response.data.length,
            hasIrradiance: response.data.some(d => d.solar !== null),
            avgIrradiance: response.data.length > 0 ?
                response.data.reduce((sum, d) => sum + (d.solar || 0), 0) / response.data.length : 0,
            timeRange: response.data.length > 0 ? {
                start: response.data[0]?.bucket,
                end: response.data[response.data.length - 1]?.bucket
            } : null
        });

        return response;

    } catch (error) {
        // ============= 에러 처리 =============

        console.error('☀️ 태양광 API 에러:', error);

        // 에러 시 기본 응답 반환 (UI 안정성 보장)
        return {
            window: null,
            bucket: "1h",
            series: ["solar"],
            data: [],
            stats: { solar: { avg: null, max: null, min: null, count: 0 } },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * 실시간 태양광 데이터 조회 (간편 함수)
 * 
 * @param deviceId 장치 ID
 * @returns 최근 15분간의 일사량 데이터
 */
export async function fetchSolarRealtime(deviceId: number) {
    return fetchSolarQuery({
        device_id: deviceId,
        preset: '15m',
        max_points: 300
    });
}

/**
 * 태양광 히스토리 데이터 조회 (간편 함수)
 * 
 * @param deviceId 장치 ID  
 * @param preset 시간 범위
 * @returns 지정된 기간의 일사량 데이터
 */
export async function fetchSolarHistory(deviceId: number, preset: string) {
    return fetchSolarQuery({
        device_id: deviceId,
        preset,
        max_points: 2000
    });
}
