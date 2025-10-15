// src/api/env.ts
// 환경센서(온습도) API 클라이언트
// 새 백엔드 엔드포인트에 맞게 수정

import { fetchJSON } from '@/lib/http';

// ============================================================
// 타입 정의
// ============================================================

export interface EnvQueryParams {
    preset?: '1day' | '1week' | '1month' | '1year';  // ✅ 새 백엔드 형식
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid: number;  // 필수
}

export interface EnvDataPoint {
    bucket: string;                     // ISO 8601 timestamp (KST)
    avg_temperature: number | null;     // 평균 온도 (°C)
    min_temperature: number | null;     // 최소 온도 (°C)
    max_temperature: number | null;     // 최대 온도 (°C)
    avg_humidity: number | null;        // 평균 습도 (%RH)
    min_humidity: number | null;        // 최소 습도 (%RH)
    max_humidity: number | null;        // 최대 습도 (%RH)
}

export interface EnvQueryResponse {
    device_id: number;
    resolution: '1min' | '15min' | '1hour' | '1day';
    start: string;
    end: string;
    data_points: number;
    data: EnvDataPoint[];
}

export interface EnvRealtimeResponse {
    time_stamp: string;
    device_id: number;
    temperature: number | null;
    humidity: number | null;
}

export interface EnvStatisticsResponse {
    device_id: number;
    avg_temperature: number | null;
    min_temperature: number | null;
    max_temperature: number | null;
    avg_humidity: number | null;
    min_humidity: number | null;
    max_humidity: number | null;
    period_days: number;
}

export interface EnvComfortResponse {
    device_id: number;
    temperature: number | null;
    humidity: number | null;
    temp_status: 'low' | 'comfortable' | 'high' | 'unknown';
    humidity_status: 'low' | 'comfortable' | 'high' | 'unknown';
    overall_comfort: 'uncomfortable' | 'comfortable' | 'unknown';
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
export async function fetchEnvQuery(
    params: EnvQueryParams
): Promise<EnvQueryResponse> {
    const q = new URLSearchParams();

    // preset 기본값: 1day
    q.set('preset', params.preset ?? '1day');

    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 1440));
    q.set('deviceid', String(params.deviceid));

    return await fetchJSON<EnvQueryResponse>(`/data/env/query?${q.toString()}`);
}

/**
 * 실시간 데이터 조회 (최신 1건)
 * 
 * @param deviceId - 디바이스 ID (21~23)
 * @returns 실시간 데이터
 */
export async function fetchRealtime(deviceId: number): Promise<EnvRealtimeResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<EnvRealtimeResponse>(`/data/env/realtime?${q.toString()}`);
}

/**
 * 통계 조회 (최근 N일)
 * 
 * @param deviceId - 디바이스 ID (21~23)
 * @param days - 통계 기간 (일)
 * @returns 통계 데이터
 */
export async function fetchStatistics(
    deviceId: number,
    days: number = 7
): Promise<EnvStatisticsResponse> {
    const q = new URLSearchParams({
        deviceid: String(deviceId),
        days: String(days)
    });
    return await fetchJSON<EnvStatisticsResponse>(`/data/env/statistics?${q.toString()}`);
}

/**
 * 쾌적도 지수 조회
 * 
 * @param deviceId - 디바이스 ID (21~23)
 * @returns 쾌적도 데이터
 */
export async function fetchComfort(deviceId: number): Promise<EnvComfortResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<EnvComfortResponse>(`/data/env/comfort?${q.toString()}`);
}

// ============================================================
// 레거시 호환 함수
// ============================================================

/**
 * @deprecated fetchRealtime 사용 권장
 */
export async function fetchEnvRealtime(deviceId: number) {
    const data = await fetchRealtime(deviceId);
    return {
        deviceid: data.device_id,
        timestamp: data.time_stamp,
        metrics: {
            temp: data.temperature,
            hum: data.humidity,
        },
        raw: data,
    };
}
