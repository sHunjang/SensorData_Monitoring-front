/**
 * Modbus 전력계 API
 * 
 * 백엔드: GET /data/modbus/query
 * 백엔드: GET /data/modbus/realtime/{device_id}
 */

import { httpGet } from '@/lib/http';

// ========================================
// 타입 정의
// ========================================

/**
 * Modbus 데이터 포인트 (단일 시점)
 */
export interface ModbusDataPoint {
    time: string;
    voltage_l1l2?: number | null;
    voltage_l2l3?: number | null;
    voltage_l3l1?: number | null;
    voltage_l1n?: number | null;
    voltage_l2n?: number | null;
    voltage_l3n?: number | null;
    current_l1?: number | null;
    current_l2?: number | null;
    current_l3?: number | null;
    power?: number | null;
    energy?: number | null;
    power_factor?: number | null;
    frequency?: number | null;
}

/**
 * Modbus 통계 데이터
 */
export interface ModbusStats {
    power: {
        avg: number;
        max: number;
        min: number;
    };
    energy: {
        total: number;
    };
}

/**
 * Modbus API 응답
 */
export interface ModbusResponse {
    window: {
        start: string;
        end: string;
    };
    bucket: string;
    series: string[];
    data: ModbusDataPoint[];
    stats: ModbusStats;
    count: number;
    message?: string;
}

/**
 * Modbus 실시간 데이터 응답
 */
export interface ModbusRealtimeResponse {
    device_id: number;
    timestamp: string;
    voltage_l1l2?: number | null;
    voltage_l2l3?: number | null;
    voltage_l3l1?: number | null;
    voltage_l1n?: number | null;
    voltage_l2n?: number | null;
    voltage_l3n?: number | null;
    current_l1?: number | null;
    current_l2?: number | null;
    current_l3?: number | null;
    power?: number | null;
    energy?: number | null;
    power_factor?: number | null;
    frequency?: number | null;
}

/**
 * Modbus 쿼리 파라미터
 */
export interface ModbusQueryParams {
    deviceid: number;
    preset: '1m' | '15m';
    maxpoints?: number;
    start?: string;
    end?: string;
}

// ========================================
// API 함수
// ========================================

/**
 * Modbus 히스토리 데이터 조회
 */
export async function fetchModbusData(params: ModbusQueryParams): Promise<ModbusResponse> {
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
    const response = await httpGet<any>(`/data/modbus/query?${queryParams.toString()}`);

    // ✅ 백엔드 응답을 프론트엔드 형식으로 변환
    const data: ModbusDataPoint[] = (response.data || []).map((row: any) => ({
        time: row.timestamp, // timestamp → time
        voltage_l1l2: row.avg_voltage_l1l2_v ?? null,
        voltage_l2l3: row.avg_voltage_l2l3_v ?? null,
        voltage_l3l1: row.avg_voltage_l3l1_v ?? null,
        voltage_l1n: row.avg_voltage_l1n_v ?? null, // 4wire만
        voltage_l2n: row.avg_voltage_l2n_v ?? null,
        voltage_l3n: row.avg_voltage_l3n_v ?? null,
        current_l1: row.avg_current_l1_a ?? null,
        current_l2: row.avg_current_l2_a ?? null,
        current_l3: row.avg_current_l3_a ?? null,
        power: row.avg_power_kw ?? null,
        energy: row.total_active_energy_kwh ?? null,
        power_factor: row.avg_power_factor ?? null,
        frequency: row.avg_frequency_hz ?? null,
    }));

    // ✅ 통계 계산
    const powers = data.map(d => d.power).filter((v): v is number => v !== null);
    const energies = data.map(d => d.energy).filter((v): v is number => v !== null);

    const stats: ModbusStats = {
        power: {
            avg: powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 0,
            max: powers.length > 0 ? Math.max(...powers) : 0,
            min: powers.length > 0 ? Math.min(...powers) : 0,
        },
        energy: {
            total: energies.length > 0 ? energies[energies.length - 1] : 0,
        },
    };

    return {
        window: {
            start: response.time_range?.start || '',
            end: response.time_range?.end || '',
        },
        bucket: response.preset || params.preset,
        series: ['voltage', 'current', 'power', 'energy'],
        data,
        stats,
        count: response.count || data.length,
    };
}

/**
 * Modbus 실시간 데이터 조회
 */
export async function fetchModbusRealtime(deviceId: number): Promise<ModbusRealtimeResponse> {
    // ✅ 백엔드 엔드포인트: /data/modbus/realtime/{device_id}
    const response = await httpGet<any>(`/data/modbus/realtime/${deviceId}`);

    // ✅ 백엔드 응답 변환
    return {
        device_id: response.device_id,
        timestamp: response.data?.timestamp || '',
        voltage_l1l2: response.data?.avg_voltage_l1l2_v ?? null,
        voltage_l2l3: response.data?.avg_voltage_l2l3_v ?? null,
        voltage_l3l1: response.data?.avg_voltage_l3l1_v ?? null,
        voltage_l1n: response.data?.avg_voltage_l1n_v ?? null,
        voltage_l2n: response.data?.avg_voltage_l2n_v ?? null,
        voltage_l3n: response.data?.avg_voltage_l3n_v ?? null,
        current_l1: response.data?.avg_current_l1_a ?? null,
        current_l2: response.data?.avg_current_l2_a ?? null,
        current_l3: response.data?.avg_current_l3_a ?? null,
        power: response.data?.avg_power_kw ?? null,
        energy: response.data?.total_active_energy_kwh ?? null,
        power_factor: response.data?.avg_power_factor ?? null,
        frequency: response.data?.avg_frequency_hz ?? null,
    };
}
