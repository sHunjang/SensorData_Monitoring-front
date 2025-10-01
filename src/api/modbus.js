// src/api/modbus.ts
/**
 * Modbus 전력 측정기 API 클라이언트
 *
 * 주요 기능:
 * - fetchModbusQuery(): 전력 시계열 데이터 조회
 * - fetchRealtime(): 최신 단일 레코드 조회
 * - fetchTodayEnergy(): 금일 누적 전력량 조회
 * - 백엔드 modbus_router.py와 완벽 호환
 * - 방어적 파싱으로 안정성 보장
 * - 드릴다운 차트 지원을 위한 데이터 정규화
 */
import { fetchJSON } from "@/lib/http";
/**
 * Modbus 시계열 데이터 조회 함수
 *
 * @param params 조회 파라미터 (device_id, preset, max_points 등)
 * @returns Modbus 데이터 및 통계 정보
 *
 * 사용 예시:
 * const result = await fetchModbusQuery({
 *   device_id: 11,
 *   preset: '1h',
 *   max_points: 500
 * });
 */
export async function fetchModbusQuery(params = {}) {
    // ============= URL 파라미터 생성 =============
    const q = new URLSearchParams();
    // 시간 범위 설정
    if (params.preset) {
        q.set("preset", params.preset);
    }
    // 시작/종료 시간 설정
    if (params.start) {
        q.set("start", params.start);
    }
    if (params.end) {
        q.set("end", params.end);
    }
    // 장치 ID 설정 (device_id와 deviceId 양쪽 지원)
    const deviceId = params.device_id ?? params.deviceId;
    if (deviceId != null) {
        q.set("device_id", String(deviceId));
    }
    // 최대 데이터 포인트 수 (기본값: 500)
    q.set("max_points", String(params.max_points ?? 500));
    // ============= API 호출 =============
    const apiUrl = `/data/modbus/query?${q.toString()}`;
    console.log('⚡ Modbus API 요청:', apiUrl);
    // 백엔드에서 반환하는 모든 시리즈 키 목록
    const defaultSeries = [
        "avg_line_to_line_volts_v",
        "avg_line_to_neutral_volts_v",
        "sum_line_currents_a",
        "total_active_power_kw",
        "total_reactive_power_kvar",
        "total_apparent_power_kva",
        "total_power_factor",
        "total_active_energy_kwh",
        "total_reactive_energy_kvarh",
        "total_apparent_energy_kvah"
    ];
    try {
        const json = await fetchJSON(apiUrl);
        console.log('⚡ Modbus API 응답:', json);
        // ============= 응답 데이터 정규화 =============
        // 기본값으로 안전한 응답 구조 생성
        const response = {
            window: json?.window ?? null,
            bucket: json?.bucket ?? "1h",
            series: Array.isArray(json?.series) ? json.series : defaultSeries,
            data: [],
            stats: json?.stats ?? {},
            error: json?.error ?? null,
        };
        // 데이터 배열 처리 및 정규화
        if (Array.isArray(json?.data)) {
            response.data = json.data.map((r) => ({
                // 시간 필드
                bucket: r.bucket ?? r.time_stamp ?? r.timestamp ?? null,
                // 장치 ID
                device_id: r.device_id ?? null,
                // 전압 필드들 (백엔드 필드명과 정확히 매칭)
                avg_line_to_line_volts_v: r.avg_line_to_line_volts_v ?? null,
                avg_line_to_neutral_volts_v: r.avg_line_to_neutral_volts_v ?? null,
                // 전류 필드
                sum_line_currents_a: r.sum_line_currents_a ?? null,
                // 전력 필드들
                total_active_power_kw: r.total_active_power_kw ?? null,
                total_reactive_power_kvar: r.total_reactive_power_kvar ?? null,
                total_apparent_power_kva: r.total_apparent_power_kva ?? null,
                total_power_factor: r.total_power_factor ?? null,
                // 에너지 필드들
                total_active_energy_kwh: r.total_active_energy_kwh ?? null,
                total_reactive_energy_kvarh: r.total_reactive_energy_kvarh ?? null,
                total_apparent_energy_kvah: r.total_apparent_energy_kvah ?? null,
            }));
        }
        // 🔍 데이터 검증 및 로깅
        console.log('⚡ 정규화된 Modbus 데이터:', {
            dataPoints: response.data.length,
            hasPower: response.data.some(d => d.total_active_power_kw !== null),
            hasEnergy: response.data.some(d => d.total_active_energy_kwh !== null),
            avgPower: response.data.length > 0 ?
                response.data.reduce((sum, d) => sum + (d.total_active_power_kw || 0), 0) / response.data.length : 0,
            timeRange: response.data.length > 0 ? {
                start: response.data[0]?.bucket,
                end: response.data[response.data.length - 1]?.bucket
            } : null
        });
        return response;
    }
    catch (error) {
        // ============= 에러 처리 =============
        console.error('⚡ Modbus API 에러:', error);
        // 에러 시 기본 응답 반환 (UI 안정성 보장)
        return {
            window: null,
            bucket: "1h",
            series: defaultSeries,
            data: [],
            stats: {},
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * 최신 실시간 Modbus 데이터 조회
 *
 * @param deviceId 장치 ID
 * @returns 최신 전력 측정값
 *
 * 사용 예시:
 * const realtime = await fetchRealtime(11);
 * console.log(`현재 전력: ${realtime.metrics.p_kw} kW`);
 */
export async function fetchRealtime(deviceId) {
    const apiUrl = `/data/modbus/realtime?device_id=${deviceId}`;
    console.log('⚡ Modbus 실시간 API 요청:', apiUrl);
    try {
        const json = await fetchJSON(apiUrl);
        console.log('⚡ Modbus 실시간 API 응답:', json);
        // 방어적 파싱으로 안전한 응답 생성
        const raw = json?.data ?? json ?? {};
        const metricsSrc = raw?.metrics ?? raw?.raw_metrics ?? raw;
        const response = {
            device_id: json?.device_id ?? deviceId,
            time_stamp: json?.time_stamp ?? raw?.time_stamp ?? null,
            metrics: {
                p_kw: metricsSrc?.p_kw ?? metricsSrc?.power_kw ?? metricsSrc?.power ?? null,
                e_kwh: metricsSrc?.e_kwh ?? metricsSrc?.energy_kwh ?? metricsSrc?.e ?? null,
                v_avg: metricsSrc?.v_avg ?? metricsSrc?.voltage ?? null,
                i_sum: metricsSrc?.i_sum ?? metricsSrc?.current ?? null,
                pf: metricsSrc?.pf ?? metricsSrc?.power_factor ?? null,
            },
            raw: json?.raw ?? raw,
        };
        return response;
    }
    catch (error) {
        console.error('⚡ Modbus 실시간 API 에러:', error);
        // 에러 시 기본 응답
        return {
            device_id: deviceId,
            time_stamp: null,
            metrics: { p_kw: null, e_kwh: null },
            raw: undefined,
        };
    }
}
/**
 * 금일 누적 전력량 조회
 *
 * @param deviceId 장치 ID
 * @returns 금일 누적 전력량 (kWh)
 *
 * 사용 예시:
 * const today = await fetchTodayEnergy(11);
 * console.log(`오늘 사용량: ${today.kwh} kWh`);
 */
export async function fetchTodayEnergy(deviceId) {
    const apiUrl = `/data/modbus/today?device_id=${deviceId}`;
    console.log('⚡ Modbus 금일 에너지 API 요청:', apiUrl);
    try {
        const json = await fetchJSON(apiUrl);
        console.log('⚡ Modbus 금일 에너지 API 응답:', json);
        return {
            device_id: json?.device_id ?? deviceId,
            kwh: json?.kwh ?? null,
            raw: json?.raw ?? { min: null, max: null },
        };
    }
    catch (error) {
        console.error('⚡ Modbus 금일 에너지 API 에러:', error);
        // 에러 시 기본 응답
        return {
            device_id: deviceId,
            kwh: null,
            raw: { min: null, max: null },
        };
    }
}
/**
 * 실시간 Modbus 데이터 조회 (간편 함수)
 *
 * @param deviceId 장치 ID
 * @returns 최근 15분간의 전력 데이터
 */
export async function fetchModbusRealtime(deviceId) {
    return fetchModbusQuery({
        device_id: deviceId,
        preset: '15m',
        max_points: 300
    });
}
/**
 * Modbus 히스토리 데이터 조회 (간편 함수)
 *
 * @param deviceId 장치 ID
 * @param preset 시간 범위
 * @returns 지정된 기간의 전력 데이터
 */
export async function fetchModbusHistory(deviceId, preset) {
    return fetchModbusQuery({
        device_id: deviceId,
        preset,
        max_points: 2000
    });
}
// ============= 타입만 내보내기 (충돌 해결) =============
