// src/pages/Modbus/ModbusContainer.tsx

/**
 * ModbusContainer.tsx - 타입 에러 완전 수정됨
 *
 * 🔧 수정사항:
 * - normalizeRows(data, boolean) → normalizeRows(data)로 수정
 * - setPeakLimits 타입 정확히 지정
 * - API 응답 구조 정확히 처리
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

// 기간 프리셋 타입 정의
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

/**
 * ModbusContainer 컴포넌트 - 모든 타입 에러 수정됨
 */
export default function ModbusContainer() {
    // 🎛️ UI 상태 관리
    const [preset, setPreset] = useState<Preset>('15m');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');
    const [deviceId, setDeviceId] = useState<number>(11);
    const [column, setColumn] = useState<string>('active_power');

    // 🚨 피크 기준값 상태 관리 (타입 정확히 지정)
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({
        // 🔌 전력 관련 기본 피크값들
        active_power: 15.0, // 유효전력 피크: 15kW
        reactive_power: 10.0, // 무효전력 피크: 10kVAR
        apparent_power: 20.0, // 피상전력 피크: 20kVA

        // ⚡ 전압 관련 기본 피크값들
        voltage_ll: 450, // 선간전압 피크: 450V
        voltage_ln: 260, // 상전압 피크: 260V

        // 🔋 전류 및 역률 기본 피크값들
        current: 80, // 전류 피크: 80A
        power_factor: 1.0, // 역률 피크: 1.0

        // 📈 전력량 관련 기본 피크값들
        active_energy: 1000, // 유효전력량 피크: 1000kWh
        reactive_energy: 500, // 무효전력량 피크: 500kVArh
        apparent_energy: 1200, // 피상전력량 피크: 1200kVAh
    });

    // 📊 데이터 상태 관리
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // ⏰ 실시간 업데이트용 타이머
    const timer = useRef<number | undefined>(undefined);

    /**
     * 🏷️ 사용 가능한 장치 번호들
     */
    const deviceOptions = [11, 12, 13, 14, 15];

    /**
     * 📝 로그 추가 함수
     */
    const log = (m: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${m}`].slice(-200));
    };

    /**
     * 📊 통계 계산 헬퍼 함수
     */
    const calc = (values: number[]) => {
        const filtered = values.filter((v) => v != null && !isNaN(v));
        if (!filtered.length) {
            return { avg: 0, max: 0, min: 0, count: 0 };
        }

        return {
            avg: filtered.reduce((a, b) => a + b, 0) / filtered.length,
            max: Math.max(...filtered),
            min: Math.min(...filtered),
            count: filtered.length,
        };
    };

    /**
     * 🔄 데이터 재계산 및 별명 생성 함수
     */
    const recompute = (rows: any[]) => {
        // 🏷️ 각 행에 사용하기 쉬운 별명 추가
        const nextRows = rows.map((r) => ({
            ...r, // 원본 데이터 유지

            // 전력 관련 별명
            active_power: r.total_active_power_kw,
            reactive_power: r.total_reactive_power_kvar,
            apparent_power: r.total_apparent_power_kva,

            // 전압 관련 별명
            voltage_ll: r.avg_line_to_line_volts_v,
            voltage_ln: r.avg_line_to_neutral_volts_v,

            // 전류 및 역률 별명
            current: r.sum_line_currents_a,
            power_factor: r.total_power_factor,

            // 전력량 관련 별명
            active_energy: r.total_active_energy_kwh,
            reactive_energy: r.total_reactive_energy_kvarh,
            apparent_energy: r.total_apparent_energy_kvah,
        }));

        // 📊 모든 컬럼별 통계 계산
        const statsObj = {
            active_power: calc(nextRows.map((r) => r.active_power)),
            reactive_power: calc(nextRows.map((r) => r.reactive_power)),
            apparent_power: calc(nextRows.map((r) => r.apparent_power)),
            voltage_ll: calc(nextRows.map((r) => r.voltage_ll)),
            voltage_ln: calc(nextRows.map((r) => r.voltage_ln)),
            current: calc(nextRows.map((r) => r.current)),
            power_factor: calc(nextRows.map((r) => r.power_factor)),
            active_energy: calc(nextRows.map((r) => r.active_energy)),
            reactive_energy: calc(nextRows.map((r) => r.reactive_energy)),
            apparent_energy: calc(nextRows.map((r) => r.apparent_energy)),
        };

        // 🔄 상태 업데이트
        setStats(statsObj);
        setData(nextRows);
    };

    /**
     * 📡 API 호출 및 데이터 가져오기 함수 (normalizeRows 에러 수정)
     */
    const pullOnce = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 📡 Modbus API 호출 (/data/modbus/query)
            const response = await fetchModbusQuery({
                device_id: deviceId,
                preset: mode === 'realtime' ? '15m' : preset,
                max_points: 1000,
            });

            // 🔧 API 응답 구조에 맞게 수정: response.rows → response.data
            if (response.data && response.data.length > 0) {
                // ⏰ 시간 정규화 (1개 파라미터만 전달 - 수정됨)
                const normalized = normalizeRows(response.data);

                // 🔄 기존 데이터와 병합
                if (mode === 'realtime') {
                    setData((prev) => {
                        const combined = [...prev, ...normalized];
                        const next = [...combined.slice(-700), ...normalized.slice(-1000)];
                        recompute(next);
                        return next;
                    });
                } else {
                    recompute(normalized);
                }

                log(`✅ 데이터 ${response.data.length}개 로드됨 (장치 ${deviceId})`);
            } else {
                log(`⚠️ 데이터 없음 (장치 ${deviceId})`);
                setData([]);
                setStats({});
            }
        } catch (err) {
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
            log(`❌ 데이터 로드 실패: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId, preset, mode]);

    /**
     * ⏰ 실시간 업데이트 타이머 관리
     */
    useEffect(() => {
        window.clearInterval(timer.current);

        if (mode === 'realtime') {
            pullOnce();
            timer.current = window.setInterval(pullOnce, 500);
            log('🔴 실시간 모드 시작 (500ms 간격)');
        } else {
            pullOnce();
            log('📊 범위 모드로 전환');
        }

        return () => window.clearInterval(timer.current);
    }, [mode, pullOnce]);

    /**
     * 🔄 수동 새로고침 함수
     */
    const onQuery = useCallback(async () => {
        log('🔄 수동 새로고침 시작');
        await pullOnce();
    }, [pullOnce]);

    // 🎨 Presenter 컴포넌트에 모든 상태와 함수들 전달
    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={deviceOptions}
            column={column}
            setColumn={setColumn}
            preset={preset}
            setPreset={setPreset}
            mode={mode}
            setMode={setMode}
            onQuery={onQuery}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits} // 🆕 피크 기준값들
            setPeakLimits={setPeakLimits} // 🆕 피크 값 설정 함수 (타입 수정됨)
        />
    );
}
