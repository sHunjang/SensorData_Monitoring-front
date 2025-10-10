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
    time: string;
    irradiance?: number | null;
}

/**
 * 일사량 통계 데이터
 */
export interface SolarStats {
    irradiance: {
        avg: number;
        max: number;
        min: number;
    };
}

/**
 * 일사량 API 응답
 */
export interface SolarResponse {
    window: {
        start: string;
        end: string;
    };
    bucket: string;
    series: string[];
    data: SolarDataPoint[];
    stats: SolarStats;
    count: number;
    message?: string;
}

/**
 * 일사량 실시간 데이터 응답
 */
export interface SolarRealtimeResponse {
    timestamp: string;
    irradiance?: number | null;
}

/**
 * 일사량 쿼리 파라미터
 */
export interface SolarQueryParams {
    preset: '1m' | '15m';
    maxpoints?: number;
    start?: string;
    end?: string;
}

// ========================================
// API 함수
// ========================================

/**
 * 일사량 히스토리 데이터 조회
 */
export async function fetchSolarData(params: SolarQueryParams): Promise<SolarResponse> {
    const queryParams = new URLSearchParams();
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

    // ✅ 백엔드 응답 받기 (deviceid 제거!)
    const response = await httpGet<any>(`/data/solar/query?${queryParams.toString()}`);

    // ✅ 백엔드 응답을 프론트엔드 형식으로 변환
    const data: SolarDataPoint[] = (response.data || []).map((row: any) => ({
        time: row.timestamp, // timestamp → time
        irradiance: row.avg_irradiance_w_m2 ?? null,
    }));

    // ✅ 통계 계산
    const irradiances = data.map(d => d.irradiance).filter((v): v is number => v !== null);

    const stats: SolarStats = {
        irradiance: {
            avg: irradiances.length > 0 ? irradiances.reduce((a, b) => a + b, 0) / irradiances.length : 0,
            max: irradiances.length > 0 ? Math.max(...irradiances) : 0,
            min: irradiances.length > 0 ? Math.min(...irradiances) : 0,
        },
    };

    return {
        window: {
            start: response.time_range?.start || '',
            end: response.time_range?.end || '',
        },
        bucket: response.preset || params.preset,
        series: ['irradiance'],
        data,
        stats,
        count: response.count || data.length,
    };
}

/**
 * 일사량 실시간 데이터 조회
 */
export async function fetchSolarRealtime(): Promise<SolarRealtimeResponse> {
    // ✅ 백엔드 엔드포인트: /data/solar/realtime (deviceid 제거!)
    const response = await httpGet<any>('/data/solar/realtime');

    // ✅ 백엔드 응답 변환
    return {
        timestamp: response.data?.timestamp || '',
        irradiance: response.data?.avg_irradiance_w_m2 ?? null,
    };
}
