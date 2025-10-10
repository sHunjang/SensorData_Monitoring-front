/**
 * 일사량 센서 API
 * 
 * 백엔드: GET /data/solar/query
 * 백엔드: GET /data/solar/realtime
 */

import { httpGet } from '@/lib/http';

// ========================================
// 타입 정의
// ========================================

/**
 * 일사량 데이터 포인트 (단일 시점)
 */
export interface SolarDataPoint {
    bucket: string;  // ✅ 'time'이 아닌 'bucket'
    irradiance: number | null;
}

/**
 * 일사량 API 응답 (Backend 형식)
 */
export interface SolarQueryResponse {
    data: SolarDataPoint[];
}

/**
 * 일사량 실시간 데이터 응답
 */
export interface SolarRealtimeResponse {
    device_id: number;
    timestamp: string;
    irradiance: number | null;
}

/**
 * 일사량 쿼리 파라미터
 */
export interface SolarQueryParams {
    preset: '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
    maxpoints?: number;
    deviceid: number;
    start?: string;
    end?: string;
}

// ========================================
// API 함수
// ========================================

/**
 * 일사량 히스토리 데이터 조회
 */
export async function fetchSolarQuery(params: SolarQueryParams): Promise<SolarQueryResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('deviceid', params.deviceid.toString());
    queryParams.append('preset', params.preset);

    if (params.maxpoints) {
        queryParams.append('maxpoints', params.maxpoints.toString());
    }

    if (params.start) {
        queryParams.append('start', params.start);
    }

    if (params.end) {
        queryParams.append('end', params.end);
    }

    // ✅ 백엔드 응답 그대로 반환
    const response = await httpGet<SolarQueryResponse>(`/data/solar/query?${queryParams.toString()}`);

    return response;
}

/**
 * 일사량 실시간 데이터 조회
 */
export async function fetchSolarRealtime(): Promise<SolarRealtimeResponse> {
    const response = await httpGet<SolarRealtimeResponse>('/data/solar/realtime');
    return response;
}
