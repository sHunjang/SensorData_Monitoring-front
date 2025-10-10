/**
 * SolarContainer.tsx
 *
 * 일사량계 데이터 관리 Container
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarData } from '@/api/solar';

type Preset = '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5;

const ZOOMS: Record<
    ZoomLevel,
    {
        preset: Preset;
        label: string;
        realtime: boolean;
        maxPoints: number;
        intervalMs: number;
    }
> = {
    0: { preset: '1m', label: '1분', realtime: true, maxPoints: 60, intervalMs: 10000 },
    1: { preset: '15m', label: '15분', realtime: true, maxPoints: 60, intervalMs: 20000 },
    2: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60, intervalMs: 30000 },
    3: { preset: '1d', label: '1일', realtime: false, maxPoints: 1440, intervalMs: 60000 },
    4: { preset: '1w', label: '1주', realtime: false, maxPoints: 336, intervalMs: 60000 },
    5: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 720, intervalMs: 60000 },
};

const DEVICE_OPTIONS = [1];

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

export const SolarContainer: React.FC = () => {
    const [deviceId, setDeviceId] = useState(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(2);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({});
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
                // ✅ 수정: preset을 직접 전달하지 않고 API가 자동 선택하도록
                const response = await fetchSolarData({
                    preset: config.preset as any, // ✅ 타입 단언
                    maxpoints: config.maxPoints,
                    start: opts?.start,
                    end: opts?.end,
                });

                setData(response.data || []);
                log(`✅ Loaded ${response.data?.length || 0} rows (${config.label})${opts?.start ? ' [Range]' : ''}`);
            } catch (e: any) {
                console.error('Failed to load solar data:', e);
                setError(e.message || 'Failed to load data');
                setData([]);
                log(`❌ Error: ${e.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        },
        [config, log]
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
            log(`📅 Range: ${sIso} ~ ${eIso}`);
            return;
        }

        load();
        if (config.realtime) {
            timerRef.current = window.setInterval(() => load(), config.intervalMs) as unknown as number;
            log(`🔄 Polling: ${config.intervalMs}ms`);
        } else {
            log(`📊 Static: ${config.label}`);
        }

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log, startAt, endAt, isRangeMode]);

    const stats = useMemo(() => {
        return calcStats(data, 'irradiance');
    }, [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 5 ? ((z + 1) as ZoomLevel) : z));

    const windowMs = useMemo(() => config.maxPoints * config.intervalMs, [config]);

    const panLeft = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        if (isRangeMode) {
            const s = new Date(toIsoLocal(startAt)!);
            const e = new Date(toIsoLocal(endAt)!);
            sIso = new Date(s.getTime() - windowMs).toISOString();
            eIso = new Date(e.getTime() - windowMs).toISOString();
        } else {
            sIso = new Date(now - windowMs * 2).toISOString();
            eIso = new Date(now - windowMs).toISOString();
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
    }, [isRangeMode, startAt, endAt, windowMs]);

    const panRight = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        if (isRangeMode) {
            const s = new Date(toIsoLocal(startAt)!);
            const e = new Date(toIsoLocal(endAt)!);
            sIso = new Date(s.getTime() + windowMs).toISOString();
            eIso = new Date(e.getTime() + windowMs).toISOString();

            if (new Date(eIso).getTime() > now) {
                eIso = new Date(now).toISOString();
                sIso = new Date(now - windowMs).toISOString();
            }
        } else {
            eIso = new Date(now).toISOString();
            sIso = new Date(now - windowMs).toISOString();
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
    }, [isRangeMode, startAt, endAt, windowMs]);

    const setRelativeRange = (minutes: number) => {
        const end = new Date();
        const start = new Date(end.getTime() - minutes * 60 * 1000);
        setStartAt(toLocalInputString(start));
        setEndAt(toLocalInputString(end));
    };

    return (
        <SolarPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={DEVICE_OPTIONS}
            zoomLevel={zoom}
            zoomLabel={config.label}
            preset={config.preset}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            canZoomIn={zoom > 0}
            canZoomOut={zoom < 5}
            onDataPointClick={(_d, _t) => {
                if (zoom === 5) setZoom(4);
                else if (zoom === 4) setZoom(3);
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
};
