/**
 * ModbusContainer.tsx
 * - ModbusPresenter에 데이터/상태/로직 제공
 * - 변경점: Presenter의 snake_case column 값에 맞춰 MAP 및 stats 생성
 * - Preset/Zoom은 7단계(10s,1m,15m,1h,1d,1w,1mo) 지원 (Modbus 패턴)
 *
 * 주의:
 * - fetchModbusQuery는 backend /data/modbus/query 엔드포인트를 호출.
 * - backend는 bucket(ISO), total_active_power_kW 등 원본 컬럼을 반환해야 함.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';

type Preset = '10s' | '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// zoom config: preset, label, realtime flag, maxPoints, intervalMs
const ZOOMS: Record<
    ZoomLevel,
    { preset: Preset; label: string; realtime: boolean; maxPoints: number; intervalMs: number }
> = {
    0: { preset: '10s', label: '10초', realtime: true, maxPoints: 60, intervalMs: 10000 },
    1: { preset: '1m', label: '1분', realtime: true, maxPoints: 120, intervalMs: 15000 },
    2: { preset: '15m', label: '15분', realtime: true, maxPoints: 60, intervalMs: 20000 },
    3: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60, intervalMs: 30000 },
    4: { preset: '1d', label: '1일', realtime: false, maxPoints: 1440, intervalMs: 60000 },
    5: { preset: '1w', label: '1주', realtime: false, maxPoints: 336, intervalMs: 60000 },
    6: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 31, intervalMs: 60000 },
};

const DEVICE_OPTIONS = [11, 12, 13, 14, 15];

/**
 * MAP:
 * 서버에서 반환하는 필드 이름(여러 버전)들을 안전하게 핸들링하여
 * Presenter가 기대하는 snake_case 키들로 변환한다.
 */
const MAP = (row: any) => ({
    bucket: row.bucket, // ISO string expected
    // 전력
    active_power: row.totalactivepowerkw ?? row.total_active_power_kw ?? row.total_active_power_kW ?? null,
    reactive_power:
        row.totalreactivepowerkvar ?? row.total_reactive_power_kvar ?? row.total_reactive_power_kVar ?? null,
    apparent_power: row.totalapparentpowerkva ?? row.total_apparent_power_kva ?? row.total_apparent_power_kVa ?? null,
    // 전압
    voltage_ll: row.avglinetolinevoltsv ?? row.avg_line_to_line_volts_v ?? null,
    voltage_ln: row.avglinetoneutralvoltsv ?? row.avg_line_to_neutral_volts_v ?? null,
    // 전류 / 역률
    current: row.sumlinecurrentsa ?? row.sum_line_currents_a ?? null,
    power_factor: row.totalpowerfactor ?? row.total_power_factor ?? null,
    // 전력량
    active_energy: row.totalactiveenergykwh ?? row.total_active_energy_kwh ?? row.total_active_energy_kWh ?? null,
    reactive_energy: row.totalreactiveenergykvarh ?? row.total_reactive_energy_kvarh ?? null,
    apparent_energy: row.totalapparentenergykvah ?? row.total_apparent_energy_kvah ?? null,
});

/** calcStats: 주어진 key에 대해 평균/최대/최소/카운트 계산 */
function calcStats(rows: any[], key: string) {
    const nums = rows.map((r) => r?.[key]).filter((v: any) => typeof v === 'number' && Number.isFinite(v)) as number[];
    if (!nums.length) return { avg: null, max: null, min: null, count: 0 };
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
        avg: Number((sum / nums.length).toFixed(3)),
        max: Math.max(...nums),
        min: Math.min(...nums),
        count: nums.length,
    };
}

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState<number>(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(3); // 기본 1h
    const [column, setColumn] = useState<
        | 'active_power'
        | 'reactive_power'
        | 'apparent_power'
        | 'voltage_ll'
        | 'voltage_ln'
        | 'current'
        | 'power_factor'
        | 'active_energy'
        | 'reactive_energy'
        | 'apparent_energy'
    >('active_power');

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);

    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({});

    const config = ZOOMS[zoom];

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // preset은 Preset 유니언 타입으로 안전하게 전달
            const res = await fetchModbusQuery({
                deviceid: deviceId,
                preset: config.preset,
                maxpoints: config.maxPoints,
            });
            const rows = (res?.data ?? []).map(MAP);
            setData(rows);
            log(`Loaded ${rows.length} rows (${config.label})`);
        } catch (e) {
            const m = getErrorMessage(e);
            setError(m);
            log(`Load error: ${m}`);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [deviceId, config, log]);

    useEffect(() => {
        load();
        // 기존 타이머 정리
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
        if (config.realtime) {
            // realtime이면 intervalMs로 폴링
            timerRef.current = window.setInterval(load, config.intervalMs) as unknown as number;
            log(`Realtime polling every ${config.intervalMs}ms`);
        } else {
            log(`${config.label} static`);
        }
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log]);

    const stats = useMemo(() => {
        const keys: string[] = [
            'active_power',
            'reactive_power',
            'apparent_power',
            'voltage_ll',
            'voltage_ln',
            'current',
            'power_factor',
            'active_energy',
            'reactive_energy',
            'apparent_energy',
        ];
        const s: Record<string, any> = {};
        for (const k of keys) s[k] = calcStats(data, k);
        return s as Record<string, any>;
    }, [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 6 ? ((z + 1) as ZoomLevel) : z));

    // 드릴다운: 제한된 경로만 허용(1mo -> 1w -> 1d -> 1h)
    const onDataPointClick = (_d: any, _t: number) => {
        if (zoom === 6) setZoom(5);
        else if (zoom === 5) setZoom(4);
        else if (zoom === 4) setZoom(3);
    };

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={DEVICE_OPTIONS}
            column={column}
            setColumn={setColumn}
            zoomLevel={zoom}
            zoomLabel={config.label}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            canZoomIn={zoom > 0}
            canZoomOut={zoom < 6}
            onDataPointClick={onDataPointClick}
            onManualRefresh={load}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits}
            setPeakLimits={setPeakLimits}
        />
    );
}
