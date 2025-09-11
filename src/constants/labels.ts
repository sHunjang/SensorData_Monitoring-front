// src/constants/labels.ts
/** DB 컬럼명 / 간단 키 → 사용자 라벨 매핑 */
export const SERIES_LABELS: Record<string, string> = {
    // 간단 키 (그래프용)
    power: "전력 (kW)",
    current: "전류 (A)",
    voltage: "전압 (V)",
    energy: "전력량 (kWh)",

    // 전력량계 (DB 컬럼명 그대로)
    avg_power_factor: "평균 역률",
    total_active_power_kw: "총 유효전력 (kW)",
    total_reactive_power_kvar: "총 무효전력 (kvar)",
    total_apparent_power_kva: "총 피상전력 (kVA)",
    sum_line_currents_a: "전류합 (A)",
    avg_line_current_a: "평균 전류 (A)",
    avg_line_to_line_volts_v: "평균 선간전압 (V)",
    avg_line_to_neutral_volts_v: "평균 상전압 (V)",
    total_active_energy_kwh: "총 전력량 (kWh)",
    total_reactive_energy_kvarh: "총 무효전력량 (kvarh)",
    total_apparent_energy_kvah: "총 피상전력량 (kVAh)",

    // 환경센서
    temperature: "온도 (℃)",
    humidity: "습도 (%)",

    // 일사량
    solar: "일사량 (W/m²)",
};
