// src/pages/Modbus/ModbusContainer.tsx
/**
 * ModbusContainer
 *
 * - EnvContainer와 동일한 패턴으로 구현.
 * - mode: 'realtime' (폴링으로 최신 데이터 병합) / 'range' (기간 조회)
 * - fetchModbusQuery()를 사용해 rows를 받아 normalizeRows()로 통일된 형태로 변환.
 * - stats 계산은 프레젠터에도 전달하지만 LineChartWrapper가 자체 레이블/키로 렌더링 가능하도록 data[] 보존.
 *
 * 사용:
 * - Presenter는 기존 인터페이스(데이터, stats, loading, error, logs, deviceId setters)를 그대로 받음.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

/* Preset type 공통 */
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

export default function ModbusContainer() {
    const [preset, setPreset] = useState<Preset>('15m');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [deviceId, setDeviceId] = useState<number>(11); // 기본 장치
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-300));

    // 간단 stats 재계산 (Presenter/StatsPanel 용)
    const recompute = (rows: any[]) => {
        const power = rows
            .map((r) => r.total_active_power_kw)
            .filter((v): v is number => v != null && Number.isFinite(v));
        const energy = rows
            .map((r) => r.total_active_energy_kwh)
            .filter((v): v is number => v != null && Number.isFinite(v));
        const calc = (arr: number[]) =>
            arr.length
                ? {
                      avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3),
                      max: Math.max(...arr),
                      min: Math.min(...arr),
                      count: arr.length,
                  }
                : { avg: null, max: null, min: null, count: 0 };

        setStats({ power: calc(power), energy: calc(energy) });
    };

    // realtime 모드: 최신 rows를 주기적으로 가져와 기존 data에 이어붙임
    const pullOnce = useCallback(async () => {
        setLoading(true);
        try {
            // preset 15m, 적당한 max_points (300)
            const res = await fetchModbusQuery({ device_id: deviceId, preset: '15m', max_points: 300 });
            // normalizeRows: ISO bucket -> epoch(ms) 등 LineChartWrapper가 기대하는 형식으로 변환
            const rows = normalizeRows(res.data ?? []);
            if (rows.length) {
                setData((prev) => {
                    // keep history small: 마지막 1000 포인트만 유지
                    const next = [...prev.slice(-700), ...rows].slice(-1000);
                    recompute(next);
                    return next;
                });
                log(
                    `realtime ok device=${deviceId} lastP=${rows.at(-1)?.total_active_power_kw} lastE=${
                        rows.at(-1)?.total_active_energy_kwh
                    }`
                );
            } else {
                // 빈 데이터여도 상태 갱신
                setData([]);
                setStats({});
                log(`realtime empty device=${deviceId}`);
            }
            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    // range 모드: 사용자가 기간조회(PeriodControls에서 onQuery 호출)
    const queryRange = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchModbusQuery({ device_id: deviceId, preset, max_points: 2000 });
            const rows = normalizeRows(res.data ?? []);
            setData(rows);
            recompute(rows);
            log(`range ok device=${deviceId} n=${rows.length}`);
            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            setData([]);
            setStats({});
            log(`range error ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [preset, deviceId]);

    // 모드에 따라 폴링 시작/중지
    useEffect(() => {
        window.clearInterval(timer.current);
        if (mode === 'realtime') {
            pullOnce();
            // Env와 동일하게 500ms 폴링 (환경에 따라 늘려도 됨)
            timer.current = window.setInterval(pullOnce, 500);
        }
        return () => window.clearInterval(timer.current);
    }, [mode, pullOnce]);

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={(id) => setDeviceId(id)}
            deviceOptions={[11, 12, 13]} /* 실제 목록으로 바꾸세요 */
            column={'power'}
            setColumn={() => {}}
            preset={preset}
            setPreset={setPreset}
            mode={mode}
            setMode={setMode}
            onQuery={mode === 'realtime' ? pullOnce : queryRange}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
        />
    );
}
