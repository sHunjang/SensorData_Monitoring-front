/**
 * EnvContainer.tsx
 * - Modbus 패턴에 맞춘 Container
 * - 7단계 줌 지원: 10s,1m,15m,1h,1d,1w,1mo
 * - fetchEnvQuery({ deviceid, preset, maxpoints }) 사용
 * - realtime 폴링 제어: 단기(10s~1h) 실시간, 장기(1d/1w/1mo) 정적
 * - 드릴다운은 제한: 1mo -> 1w -> 1d -> 1h
 *
 * 주의:
 * - fetchEnvQuery가 Preset 타입을 허용하도록 백엔드/타입 정의가 필요.
 * - bucket은 ISO 문자열이어야 함.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
import { getErrorMessage } from '@/lib/http';

type Preset = '10s' | '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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

const DEVICE_OPTIONS = [21, 22, 23];

/** 통계 계산: 컬럼(temperature|humidity) 기준 평균/최대/최소/카운트 */
function calcStats(rows: any[], key: 'temperature' | 'humidity') {
    const nums = rows.map((r) => r?.[key]).filter((v: any) => typeof v === 'number' && Number.isFinite(v)) as number[];
    if (!nums.length) return { avg: null, max: null, min: null, count: 0 };
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
        avg: Number((sum / nums.length).toFixed(2)),
        max: Math.max(...nums),
        min: Math.min(...nums),
        count: nums.length,
    };
}

/** MAP: API row -> chart row (bucket은 ISO string) */
const MAP = (d: any) => ({
    bucket: d.bucket,
    temperature: typeof d.temperature === 'number' && Number.isFinite(d.temperature) ? d.temperature : null,
    humidity: typeof d.humidity === 'number' && Number.isFinite(d.humidity) ? d.humidity : null,
});

export default function EnvContainer() {
    const [deviceId, setDeviceId] = useState<number>(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(3); // 기본 1h
    const [column, setColumn] = useState<'temperature' | 'humidity'>('temperature');

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);

    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({ temperature: 30, humidity: 80 });

    const config = ZOOMS[zoom];

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Preset은 유니언 타입. fetchEnvQuery 구현체가 이를 허용해야 함.
            const res = await fetchEnvQuery({
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
            setData([]);
            log(`Load error: ${m}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId, config, log]);

    // 마운트 및 zoom 변경 시 로드. realtime이면 interval 등록.
    useEffect(() => {
        load();
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
        if (config.realtime) {
            timerRef.current = window.setInterval(load, config.intervalMs) as unknown as number;
            log(`Realtime polling ${config.intervalMs}ms`);
        } else {
            log(`${config.label} static`);
        }
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log]);

    const stats = useMemo(
        () => ({ temperature: calcStats(data, 'temperature'), humidity: calcStats(data, 'humidity') }),
        [data]
    );

    // Zoom controls
    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 6 ? ((z + 1) as ZoomLevel) : z));

    /**
     * onDataPointClick (드릴다운)
     * - 제한된 드릴다운 경로: 1mo -> 1w -> 1d -> 1h
     * - 다른 줌(예: 15m,1m,10s)은 차트 확대/리얼타임 용도
     */
    const onDataPointClick = (_d: any, _t: number) => {
        if (zoom === 6) setZoom(5); // 1mo -> 1w
        else if (zoom === 5) setZoom(4); // 1w -> 1d
        else if (zoom === 4) setZoom(3); // 1d -> 1h
        // 1h 이하(3 이하)는 드릴다운 없음
    };

    return (
        <EnvPresenter
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
            canZoomOut={zoom < 6}
            onDataPointClick={onDataPointClick}
            onManualRefresh={load}
            data={data}
            stats={stats as any}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits}
            setPeakLimits={setPeakLimits}
        />
    );
}
