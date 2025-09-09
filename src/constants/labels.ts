// src/constants/labels.ts
/** 시리즈 키 → 표시 라벨 매핑 */
export const SERIES_LABELS: Record<string, string> = {
    // Modbus
    p_total: '유효전력(kW)',
    q_total: '무효전력(kvar)',
    s_total: '피상전력(kVA)',
    pf_total: '역률',
    voltage: '전압(V)',
    current: '전류합(A)',
    // Env
    temperature: '온도(°C)',
    humidity: '습도(%)',
    // Solar
    solar: '일사량(W/m²)',
};
