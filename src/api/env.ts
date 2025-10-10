/**
 * 환경센서 API
 * 
 * 백엔드: GET /data/env/query
 * 백엔드: GET /data/env/realtime/{device_id}
 */

import { httpGet } from '@/lib/http';

// ========================================
// 타입 정의
// ========================================

/**
 * 환경센서 데이터 포인트 (단일 시점)
 */
export interface EnvDataPoint {
    time: string; // ISO 8601 형식
    temperature?: number | null;
    humidity?: number | null;
}

/**
 * 환경센서 통계 데이터
 */
export interface EnvStats {
    temperature: {
        avg: number;
        max: number;
        min: number;
    };
    humidity: {
        avg: number;
        max: number;
        min: number;
    };
}

/**
 * 환경센서 API 응답
 */
export interface EnvResponse {
    window: {
        start: string;
        end: string;
    };
    bucket: string; // "1m", "15m" 등
    series: string[]; // ["temperature", "humidity"]
    data: EnvDataPoint[];
    stats: EnvStats;
    count: number;
    message?: string;
}

/**
 * 환경센서 실시간 데이터 응답
 */
export interface EnvRealtimeResponse {
    device_id: number;
    timestamp: string;
    temperature?: number | null;
    humidity?: number | null;
}

/**
 * 환경센서 쿼리 파라미터
 */
export interface EnvQueryParams {
    deviceid: number; // 21-23
    preset: '1m' | '15m'; // 집계 단위
    maxpoints?: number; // 최대 포인트 수 (기본: 1000)
    start?: string; // 시작 시각 (ISO 8601)
    end?: string; // 종료 시각 (ISO 8601)
}

// ========================================
// API 함수
// ========================================

/**
 * 환경센서 히스토리 데이터 조회
 * 
 * @param params 쿼리 파라미터
 * @returns 환경센서 데이터 응답
 */
export async function fetchEnvData(params: EnvQueryParams): Promise<EnvResponse> {
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

    // ✅ 백엔드 응답 받기
    const response = await httpGet<any>(`/data/env/query?${queryParams.toString()}`);

    // ✅ 백엔드 응답을 프론트엔드 형식으로 변환
    const data: EnvDataPoint[] = (response.data || []).map((row: any) => ({
        time: row.timestamp, // timestamp → time
        temperature: row.avg_temperature_c ?? null,
        humidity: row.avg_humidity_percent ?? null,
    }));

    // ✅ 통계 계산
    const temps = data.map(d => d.temperature).filter((v): v is number => v !== null);
    const humids = data.map(d => d.humidity).filter((v): v is number => v !== null);

    const stats: EnvStats = {
        temperature: {
            avg: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
            max: temps.length > 0 ? Math.max(...temps) : 0,
            min: temps.length > 0 ? Math.min(...temps) : 0,
        },
        humidity: {
            avg: humids.length > 0 ? humids.reduce((a, b) => a + b, 0) / humids.length : 0,
            max: humids.length > 0 ? Math.max(...humids) : 0,
            min: humids.length > 0 ? Math.min(...humids) : 0,
        },
    };

    return {
        window: {
            start: response.time_range?.start || '',
            end: response.time_range?.end || '',
        },
        bucket: response.preset || params.preset,
        series: ['temperature', 'humidity'],
        data,
        stats,
        count: response.count || data.length,
    };
}

/**
 * 환경센서 실시간 데이터 조회
 * 
 * @param deviceId 디바이스 ID (21-23)
 * @returns 실시간 데이터
 */
export async function fetchEnvRealtime(deviceId: number): Promise<EnvRealtimeResponse> {
    // ✅ 백엔드 엔드포인트: /data/env/realtime/{device_id}
    const response = await httpGet<any>(`/data/env/realtime/${deviceId}`);

    // ✅ 백엔드 응답 변환
    return {
        device_id: response.device_id,
        timestamp: response.data?.timestamp || '',
        temperature: response.data?.avg_temperature_c ?? null,
        humidity: response.data?.avg_humidity_percent ?? null,
    };
}
