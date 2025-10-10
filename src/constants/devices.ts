/**
 * 디바이스 상수
 * 
 * 백엔드 설정과 일치하는 디바이스 ID 정의
 */

/**
 * Modbus 전력계 디바이스 ID
 */
export const MODBUS_DEVICE_IDS = [11, 12, 13, 14, 15] as const;

/**
 * 3상 4선 디바이스 ID (중성선 있음)
 */
export const THREE_PHASE_FOUR_WIRE_IDS = [11, 12, 13] as const;

/**
 * 3상 3선 디바이스 ID (중성선 없음)
 */
export const THREE_PHASE_THREE_WIRE_IDS = [14, 15] as const;

/**
 * 환경(온습도) 센서 디바이스 ID
 */
export const ENV_DEVICE_IDS = [21, 22, 23] as const;

/**
 * 일사량 센서 디바이스 ID
 */
export const SOLAR_DEVICE_ID = 31;

/**
 * 디바이스 타입
 */
export type DeviceType = 'modbus' | 'env' | 'solar';

/**
 * 디바이스 ID 유효성 검증
 */
export function isValidModbusDevice(id: number): boolean {
    return MODBUS_DEVICE_IDS.includes(id as any);
}

export function isValidEnvDevice(id: number): boolean {
    return ENV_DEVICE_IDS.includes(id as any);
}

export function isValidSolarDevice(id: number): boolean {
    return id === SOLAR_DEVICE_ID;
}

/**
 * 3상 4선 여부 확인
 */
export function isThreePhaseFourWire(id: number): boolean {
    return THREE_PHASE_FOUR_WIRE_IDS.includes(id as any);
}

/**
 * 3상 3선 여부 확인
 */
export function isThreePhaseThreeWire(id: number): boolean {
    return THREE_PHASE_THREE_WIRE_IDS.includes(id as any);
}
