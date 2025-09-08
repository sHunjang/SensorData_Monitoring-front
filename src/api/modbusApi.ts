/**
 * Modbus API 모듈
 * - FastAPI(`/data/modbus`, `/data/modbus/realtime`)와 통신
 * - Container에서 호출해 Presenter로 전달
 */

import axios from 'axios';

/** 서버 베이스 URL: FastAPI 실행 포트와 일치시킬 것 */
const api = axios.create({
    baseURL: "http://localhost:8000",
    timeout: 8000,
});

/** 시간 버킷 데이터 1건 형식 */
export interface ModbusPoint {
    bucket: string;          // ISO 문자열(백엔드에서 timestamptz 직렬화됨)
    voltage: number | null;  // 평균 전압
    current: number | null;  // 전류 합
    p_total: number | null;  // 전체 유효전력(kW)
}

/** 집계 데이터 조회 */
export async function fetchModbusData(
    interval: string,
    start?: string,
    end?: string
): Promise<ModbusPoint[]> {
    const res = await api.get("/data/modbus", { params: { interval, start, end } });
    return res.data;
}

/** 실시간 전력(kW) */
export async function fetchRealtimePower(): Promise<number | null> {
    const res = await api.get("/data/modbus/realtime");
    return res.data?.realtime_power_kW ?? null;
}
