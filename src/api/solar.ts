// src/api/solar.ts
// 태양광(일사량) 센서 API 클라이언트
// 새 백엔드 엔드포인트에 맞게 수정

import { fetchJSON } from '@/lib/http';

// ============================================================
// 타입 정의
// ============================================================

export interface SolarQueryParams {
    preset?: '1day' | '1week' | '1month' | '1year';  // ✅ 새 백엔드 형식
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid: number;  // 필수 (기본값: 31)
}

export interface SolarDataPoint {
    bucket: string;                    // ISO 8601 timestamp (KST)
    avg_irradiance: number | null;     // 평균 일사량 (W/m²)
    min_irradiance: number | null;     // 최소 일사량 (W/m²)
    max_irradiance: number | null;     // 최대 일사량 (W/m²)
}

export interface SolarQueryResponse {
    device_id: number;
    resolution: '1min' | '15min' | '1hour' | '1day';
    start: string;
    end: string;
    data_points: number;
    data: SolarDataPoint[];
}

export interface SolarRealtimeResponse {
    time_stamp: string;
    device_id: number;
    irradiance: number | null;  // W/m²
}

export interface SolarStatisticsResponse {
    device_id: number;
    avg_irradiance: number | null;
    max_irradiance: number | null;
    total_solar_hours: number;     // 일조 시간 (시간)
    period_days: number;
}

export interface SolarEfficiencyResponse {
    device_id: number;
    current_irradiance: number | null;
    efficiency_percent: number | null;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'none' | 'unknown';
}

export interface SolarTodayEnergyResponse {
    device_id: number;
    date: string;
    solar_energy_wh_per_m2: number | null;  // Wh/m²
}

// ============================================================
// API 함수
// ============================================================

/**
 * 시계열 데이터 조회 (그래프용)
 * 
 * @param params - 조회 파라미터
 * @returns 시계열 데이터
 */
export async function fetchSolarQuery(
    params: SolarQueryParams
): Promise<SolarQueryResponse> {
    const q = new URLSearchParams();

    // preset 기본값: 1day
    q.set('preset', params.preset ?? '1day');

    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 1440));
    q.set('deviceid', String(params.deviceid ?? 31));  // 기본값 31

    return await fetchJSON<SolarQueryResponse>(`/data/solar/query?${q.toString()}`);
}

/**
 * 실시간 데이터 조회 (최신 1건)
 * 
 * @param deviceId - 디바이스 ID (기본값: 31)
 * @returns 실시간 데이터
 */
export async function fetchRealtime(deviceId: number = 31): Promise<SolarRealtimeResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<SolarRealtimeResponse>(`/data/solar/realtime?${q.toString()}`);
}

/**
 * 통계 조회 (최근 N일)
 * 
 * @param deviceId - 디바이스 ID (기본값: 31)
 * @param days - 통계 기간 (일)
 * @returns 통계 데이터
 */
export async function fetchStatistics(
    deviceId: number = 31,
    days: number = 7
): Promise<SolarStatisticsResponse> {
    const q = new URLSearchParams({
        deviceid: String(deviceId),
        days: String(days)
    });
    return await fetchJSON<SolarStatisticsResponse>(`/data/solar/statistics?${q.toString()}`);
}

/**
 * 발전 효율 추정
 * 
 * @param deviceId - 디바이스 ID (기본값: 31)
 * @returns 효율 데이터
 */
export async function fetchEfficiency(deviceId: number = 31): Promise<SolarEfficiencyResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<SolarEfficiencyResponse>(`/data/solar/efficiency?${q.toString()}`);
}

/**
 * 오늘 일사량 적산값 조회
 * 
 * @param deviceId - 디바이스 ID (기본값: 31)
 * @returns 오늘 일사량 데이터
 */
export async function fetchTodayEnergy(deviceId: number = 31): Promise<SolarTodayEnergyResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<SolarTodayEnergyResponse>(`/data/solar/today-energy?${q.toString()}`);
}

// ============================================================
// 레거시 호환 함수
// ============================================================

/**
 * @deprecated fetchRealtime 사용 권장
 */
export async function fetchSolarRealtime(deviceId: number = 31) {
    const data = await fetchRealtime(deviceId);
    return {
        deviceid: data.device_id,
        timestamp: data.time_stamp,
        metrics: {
            irradiance: data.irradiance,
        },
        raw: data,
    };
}
