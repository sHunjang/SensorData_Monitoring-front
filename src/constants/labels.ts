/**
 * 차트 및 UI 라벨 정의
 * 
 * DB 컬럼명 / 간단 키 → 사용자 라벨 매핑
 */

/**
 * 시리즈 라벨 (DB 컬럼명 및 간단 키)
 */
export const SERIES_LABELS: Record<string, string> = {
    // ========================================
    // 간단 키 (그래프용)
    // ========================================
    power: '전력 (kW)',
    current: '전류 (A)',
    voltage: '전압 (V)',
    energy: '전력량 (kWh)',

    // ========================================
    // 전력량계 (DB 컬럼명 그대로)
    // ========================================
    // 전압
    voltage_l1l2: 'L1-L2 전압 (V)',
    voltage_l2l3: 'L2-L3 전압 (V)',
    voltage_l3l1: 'L3-L1 전압 (V)',
    voltage_l1n: 'L1-N 전압 (V)',
    voltage_l2n: 'L2-N 전압 (V)',
    voltage_l3n: 'L3-N 전압 (V)',
    avg_line_to_line_volts_v: '평균 선간전압 (V)',
    avg_line_to_neutral_volts_v: '평균 상전압 (V)',

    // 전류
    current_l1: 'L1 전류 (A)',
    current_l2: 'L2 전류 (A)',
    current_l3: 'L3 전류 (A)',
    sum_line_currents_a: '전류합 (A)',
    avg_line_current_a: '평균 전류 (A)',

    // 전력
    total_active_power_kw: '총 유효전력 (kW)',
    total_reactive_power_kvar: '총 무효전력 (kvar)',
    total_apparent_power_kva: '총 피상전력 (kVA)',

    // 전력량
    total_active_energy_kwh: '총 전력량 (kWh)',
    total_reactive_energy_kvarh: '총 무효전력량 (kvarh)',
    total_apparent_energy_kvah: '총 피상전력량 (kVAh)',

    // 기타
    avg_power_factor: '평균 역률',
    power_factor: '역률',
    frequency: '주파수 (Hz)',

    // ========================================
    // 환경센서 (DB 컬럼명)
    // ========================================
    temperature: '온도 (℃)',
    humidity: '습도 (%)',

    // ========================================
    // 일사량 (DB 컬럼명)
    // ========================================
    solar: '일사량 (W/m²)',
    irradiance: '일사량 (W/m²)',
};

/**
 * Preset 라벨 (한글)
 */
export const PRESET_LABELS: Record<string, string> = {
    '1m': '1분',
    '15m': '15분',
    '1h': '1시간',
    '1d': '1일',
};

/**
 * 디바이스 타입 라벨 (한글)
 */
export const DEVICE_TYPE_LABELS: Record<string, string> = {
    modbus: '전력량계',
    env: '환경센서',
    solar: '일사량계',
};
