// src/constants/labels.ts
/** DB 컬럼명 → 사용자 라벨 매핑 */
export const SERIES_LABELS: Record<string, string> = {
    // 전력량계
    avg_power_factor: '평균 역률',
    total_active_power_kW: '총 유효전력 (kW)',
    total_reactive_power_kvar: '총 무효전력 (kvar)',
    total_apparent_power_kVA: '총 피상전력 (kVA)',
    sum_line_currents_A: '전류합 (A)',
    avg_line_current_A: '평균전류 (A)',
    avg_line_to_line_volts_V: '평균 선간전압 (V)',
    avg_line_to_neutral_volts_V: '평균 상전압 (V)',
    total_active_energy_kwh: '총 전력량 (kWh)',
    total_reactive_energy_kvarh: '총 무효전력량 (kvarh)',
    total_apparent_energy_kVAh: '총 피상전력량 (kVAh)',

    // 환경센서
    temperature: '온도 (°C)',
    humidity: '습도 (%)',

    // 일사량
    solar: '일사량 (W/m²)',
};
