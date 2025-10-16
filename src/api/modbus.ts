// src/api/modbus.ts
// Modbus(전력량계) API 클라이언트

import { fetchJSON } from '@/lib/http';

// ============================================================
// 타입 정의
// ============================================================

export interface ModbusQueryParams {
    preset?: '1day' | '1week' | '1month' | '1year';
    maxpoints?: number;
    start?: string;
    end?: string;
    deviceid?: number;
}

export interface ModbusDataPoint {
    bucket: string;
    voltage: number | null;
    current: number | null;
    power: number | null;
    energy_delta: number | null;
    peak_power?: number | null;
}

export interface ModbusQueryResponse {
    device_id: number;
    wire_type: '4wire' | '3wire';
    resolution: '1min' | '15min' | '1hour' | '1day';
    start: string;
    end: string;
    data_points: number;
    data: ModbusDataPoint[];
}

export interface ModbusRealtimeResponse {
    time_stamp: string;
    device_id: number;
    voltage: number | null;
    current: number | null;
    power: number | null;
    energy: number | null;
    reactive_power?: number | null;
    apparent_power?: number | null;
    power_factor?: number | null;
    reactive_energy?: number | null;
    apparent_energy?: number | null;
}

export interface ModbusTodayEnergyResponse {
    device_id: number;
    date: string;
    energy_kwh: number | null;
    wire_type: '4wire' | '3wire';
}

export interface ModbusStatisticsResponse {
    device_id: number;
    total_energy_kwh: number;
    avg_power_kw: number;
    peak_power_kw: number;
    period_days: number;
    wire_type: '4wire' | '3wire';
}

// ============================================================
// API 함수
// ============================================================

/**
 * 시계열 데이터 조회 (그래프용)
 */
export async function fetchModbusQuery(
    params: ModbusQueryParams = {}
): Promise<ModbusQueryResponse> {
    const q = new URLSearchParams();
    q.set('preset', params.preset ?? '1day');
    if (params.start) q.set('start', params.start);
    if (params.end) q.set('end', params.end);
    q.set('maxpoints', String(params.maxpoints ?? 1440));
    if (params.deviceid != null) {
        q.set('deviceid', String(params.deviceid));
    } else {
        throw new Error('deviceid is required');
    }
    return await fetchJSON<ModbusQueryResponse>(`/data/modbus/query?${q.toString()}`);
}

/**
 * ✅ 실시간 데이터 조회 (최신 1건)
 * 백엔드가 단일 객체를 반환합니다.
 */
export async function fetchRealtime(deviceId: number): Promise<ModbusRealtimeResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });

    console.log('🌐 [API] Calling /data/modbus/realtime with deviceId:', deviceId);

    // ✅ /realtime 엔드포인트 호출 (단일 객체 반환)
    const result = await fetchJSON<ModbusRealtimeResponse>(`/data/modbus/realtime?${q.toString()}`);

    console.log('🌐 [API] /realtime response:', result);

    return result;
}

/**
 * ✅ 오늘 누적 에너지 조회
 */
export async function fetchTodayEnergy(deviceId: number): Promise<ModbusTodayEnergyResponse> {
    const q = new URLSearchParams({ deviceid: String(deviceId) });
    return await fetchJSON<ModbusTodayEnergyResponse>(`/data/modbus/today-energy?${q.toString()}`);
}

/**
 * 통계 조회 (최근 N일)
 */
export async function fetchStatistics(
    deviceId: number,
    days: number = 7
): Promise<ModbusStatisticsResponse> {
    const q = new URLSearchParams({
        deviceid: String(deviceId),
        days: String(days)
    });
    return await fetchJSON<ModbusStatisticsResponse>(`/data/modbus/statistics?${q.toString()}`);
}

// ============================================================
// 레거시 호환 함수 (deprecated)
// ============================================================

/**
 * @deprecated fetchRealtime 사용 권장
 */
export async function fetchModbusRealtime(deviceId: number) {
    const data = await fetchRealtime(deviceId);
    return {
        deviceid: data.device_id,
        timestamp: data.time_stamp,
        metrics: {
            pkw: data.power,
            ekwh: data.energy,
        },
        raw: data,
    };
}

/**
 * @deprecated fetchTodayEnergy 사용 권장
 */
export async function fetchModbusTodayEnergy(deviceId: number) {
    const data = await fetchTodayEnergy(deviceId);
    return {
        deviceid: data.device_id,
        kwh: data.energy_kwh,
        raw: data,
    };
}
