import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';

type Preset = '1day' | '1week' | '1month' | '1year';
type ZoomLevel = 0 | 1 | 2 | 3;

// ✅ 요구사항에 맞춘 ZOOM 설정
const ZOOMS: Record<
    ZoomLevel,
    {
        preset: Preset;
        label: string;
        realtime: boolean;
        maxPoints: number;
        intervalMs: number;
        panUnit: 'day' | 'week' | 'month' | 'year'; // ✅ 추가
    }
> = {
    0: { preset: '1day', label: '1일', realtime: true, maxPoints: 1440, intervalMs: 60000, panUnit: 'day' },
    1: { preset: '1week', label: '1주', realtime: true, maxPoints: 672, intervalMs: 900000, panUnit: 'week' },
    2: { preset: '1month', label: '1개월', realtime: false, maxPoints: 720, intervalMs: 3600000, panUnit: 'month' },
    3: { preset: '1year', label: '1년', realtime: false, maxPoints: 365, intervalMs: 86400000, panUnit: 'year' },
};

const DEVICE_OPTIONS = [11, 12, 13, 14, 15];

const MAP = (row: any) => {
    // ✅ 디버깅 로그 추가
    console.log('[MAP] Input row:', row);

    const mapped = {
        bucket: row.bucket,
        active_power: row.power ?? null,
        voltage_ll: row.voltage ?? null,
        voltage_ln: row.voltage ?? null,
        current: row.current ?? null,
        active_energy: row.energy_delta ?? null,
        peak_power: row.peak_power ?? null,
        reactive_power: null,
        apparent_power: null,
        power_factor: null,
        reactive_energy: null,
        apparent_energy: null,
    };

    // ✅ 매핑 결과 로그
    console.log('[MAP] Mapped row:', mapped);

    return mapped;
};

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

function toIsoLocal(value?: string | null) {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

function toLocalInputString(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
    )}`;
}

// ✅ Pan 유닛별 시간 계산 헬퍼
function addTimeUnit(date: Date, unit: 'day' | 'week' | 'month' | 'year', amount: number): Date {
    const d = new Date(date);
    switch (unit) {
        case 'day':
            d.setDate(d.getDate() + amount);
            break;
        case 'week':
            d.setDate(d.getDate() + amount * 7);
            break;
        case 'month':
            d.setMonth(d.getMonth() + amount);
            break;
        case 'year':
            d.setFullYear(d.getFullYear() + amount);
            break;
    }
    return d;
}

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(0); // ✅ Day View 기본
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

    const [data, setData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);

    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({
        active_power: 10,
        voltage_ll: 240,
        voltage_ln: 240,
        current: 30,
        active_energy: 1.0,
    });

    const [startAt, setStartAt] = useState<string | null>(null);
    const [endAt, setEndAt] = useState<string | null>(null);
    const isRangeMode = Boolean(startAt && endAt);
    const config = ZOOMS[zoom];

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    const load = useCallback(
        async (opts?: { start?: string; end?: string }) => {
            setLoading(true);
            setError(null);
            try {
                const params: any = {
                    deviceid: deviceId,
                    preset: config.preset,
                    maxpoints: config.maxPoints,
                };
                if (opts?.start) params.start = opts.start;
                if (opts?.end) params.end = opts.end;

                const res = await fetchModbusQuery(params);
                const rows = (res?.data ?? []).map(MAP);
                setData(rows);

                // ✅ 데이터 없을 때 오류 표시 안 함 (요구사항)
                if (rows.length === 0) {
                    log(`No data available for ${config.label}${opts?.start ? ' (range)' : ''}`);
                } else {
                    log(
                        `Loaded ${rows.length} rows (${config.label}, ${res.resolution})${opts?.start ? ' range' : ''}`
                    );
                }
            } catch (e) {
                const m = getErrorMessage(e);
                setError(m);
                setData([]); // ✅ 그래프 공백 유지
                log(`Load error: ${m}`);
            } finally {
                setLoading(false);
            }
        },
        [deviceId, config, log]
    );

    useEffect(() => {
        const sIso = toIsoLocal(startAt);
        const eIso = toIsoLocal(endAt);
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }

        if (isRangeMode) {
            load({ start: sIso!, end: eIso! });
            log(`Range mode: ${sIso} ~ ${eIso}`);
            return;
        }

        load();
        if (config.realtime) {
            timerRef.current = window.setInterval(() => load(), config.intervalMs) as unknown as number;
            log(`Realtime polling every ${config.intervalMs}ms (${config.label})`);
        } else {
            log(`${config.label} static mode`);
        }

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log, startAt, endAt, isRangeMode]);

    const stats = useMemo(() => {
        const keys: string[] = ['active_power', 'voltage_ll', 'voltage_ln', 'current', 'active_energy', 'peak_power'];
        const s: Record<string, any> = {};
        for (const k of keys) s[k] = calcStats(data, k);
        return s as Record<string, { avg: number | null; max: number | null; min: number | null; count: number }>;
    }, [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    // ✅ 요구사항에 맞춘 Pan 로직 (프리셋별 단위 이동)
    const panLeft = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        if (isRangeMode) {
            const s = new Date(toIsoLocal(startAt)!);
            const e = new Date(toIsoLocal(endAt)!);
            const newStart = addTimeUnit(s, config.panUnit, -1);
            const newEnd = addTimeUnit(e, config.panUnit, -1);
            sIso = newStart.toISOString();
            eIso = newEnd.toISOString();
        } else {
            // 현재 시점 기준으로 -1 unit
            const end = new Date(now);
            const start = addTimeUnit(end, config.panUnit, -1);
            sIso = start.toISOString();
            eIso = end.toISOString();
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
        log(`Pan Left: -1 ${config.panUnit}`);
    }, [isRangeMode, startAt, endAt, config, log]);

    const panRight = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        if (isRangeMode) {
            const s = new Date(toIsoLocal(startAt)!);
            const e = new Date(toIsoLocal(endAt)!);
            const newStart = addTimeUnit(s, config.panUnit, 1);
            const newEnd = addTimeUnit(e, config.panUnit, 1);

            // ✅ 미래로는 이동 불가
            if (newEnd.getTime() > now) {
                log(`Cannot pan to future`);
                return;
            }

            sIso = newStart.toISOString();
            eIso = newEnd.toISOString();
        } else {
            // 실시간 모드에서는 Right 비활성
            log(`Real-time mode: Cannot pan right`);
            return;
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
        log(`Pan Right: +1 ${config.panUnit}`);
    }, [isRangeMode, startAt, endAt, config, log]);

    const setRelativeRange = (minutes: number) => {
        const end = new Date();
        const start = new Date(end.getTime() - minutes * 60 * 1000);
        setStartAt(toLocalInputString(start));
        setEndAt(toLocalInputString(end));
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
            preset={config.preset}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            canZoomIn={zoom > 0}
            canZoomOut={zoom < 3}
            onDataPointClick={(_d, _t) => {
                if (zoom === 3) setZoom(2);
                else if (zoom === 2) setZoom(1);
                else if (zoom === 1) setZoom(0);
            }}
            onManualRefresh={() => {
                const s = toIsoLocal(startAt);
                const e = toIsoLocal(endAt);
                if (s && e) load({ start: s, end: e });
                else load();
            }}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits}
            setPeakLimits={setPeakLimits}
            startAt={startAt}
            endAt={endAt}
            setStartAt={setStartAt}
            setEndAt={setEndAt}
            setRelativeRange={setRelativeRange}
            isRangeMode={isRangeMode}
            panLeft={panLeft}
            panRight={panRight}
        />
    );
}
