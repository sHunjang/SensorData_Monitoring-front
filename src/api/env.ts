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
    deviceid: number;
    preset: '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
    maxpoints?: number;
    start?: string;
    end?: string;
}

// ========================================
// API 함수
// ========================================

/**
 * 환경센서 데이터 조회 (집계된 데이터)
 * 
 * @param params - 쿼리 파라미터
 * @returns 환경센서 응답 데이터
 */
export async function fetchEnvQuery(params: EnvQueryParams): Promise<EnvResponse> {
    // ✅ Query String 수동 생성
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

    // ✅ URL에 쿼리 스트링 직접 추가
    const response = await httpGet<any>(`/data/env/query?${queryParams.toString()}`);

    // 백엔드 응답 변환
    const data = (response.data || []).map((item: any) => ({
        time: item.timestamp,
        temperature: item.avg_temperature_c ?? null,
        humidity: item.avg_humidity_percent ?? null,
    }));

    // 통계 계산
    const temps = data.map((d: any) => d.temperature).filter((v: any) => v != null);
    const humids = data.map((d: any) => d.humidity).filter((v: any) => v != null);

    const stats: EnvStats = {
        temperature: {
            avg: temps.length ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : 0,
            max: temps.length ? Math.max(...temps) : 0,
            min: temps.length ? Math.min(...temps) : 0,
        },
        humidity: {
            avg: humids.length ? humids.reduce((a: number, b: number) => a + b, 0) / humids.length : 0,
            max: humids.length ? Math.max(...humids) : 0,
            min: humids.length ? Math.min(...humids) : 0,
        },
    };

    return {
        window: response.window || { start: '', end: '' },
        bucket: response.bucket || params.preset,
        series: ['temperature', 'humidity'],
        data,
        stats,
        count: data.length,
        message: response.message,
    };
}

/**
 * 환경센서 실시간 데이터 조회
 * 
 * @param params - device_id
 * @returns 실시간 환경센서 데이터
 */
export async function fetchEnvRealtime(params: { deviceid: number }): Promise<EnvRealtimeResponse> {
    const response = await httpGet<any>(`/data/env/realtime/${params.deviceid}`);

    return {
        device_id: response.data.device_id,
        timestamp: response.data.timestamp,
        temperature: response.data.avg_temperature_c ?? null,
        humidity: response.data.avg_humidity_percent ?? null,
    };
}
