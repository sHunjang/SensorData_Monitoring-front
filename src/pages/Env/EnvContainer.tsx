// src/pages/Env/EnvContainer.tsx
// - 4단계 줌(1h/1d/1w/1mo)만 지원
// - API 파라미터는 deviceid/maxpoints로 통일
// - 데이터는 [{ bucket, temperature, humidity }] 형태로 Presenter에 전달

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
import { getErrorMessage } from '@/lib/http';

type ZoomLevel = 0 | 1 | 2 | 3;
type ZoomPreset = '1h' | '1d' | '1w' | '1mo';

const ZOOMS: Record<ZoomLevel, { preset: ZoomPreset; label: string; realtime: boolean; maxPoints: number }> = {
    0: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60 },
    1: { preset: '1d', label: '1일', realtime: true, maxPoints: 1440 },
    2: { preset: '1w', label: '1주', realtime: false, maxPoints: 336 },
    3: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 31 },
};

const DEVICE_OPTIONS = [21, 22, 23];

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

export default function EnvContainer() {
    const [deviceId, setDeviceId] = useState<number>(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(0);
    const [column, setColumn] = useState<'temperature' | 'humidity'>('temperature');

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { preset, label, maxPoints } = ZOOMS[zoom];

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchEnvQuery({
                deviceid: deviceId,
                preset,
                maxpoints: maxPoints,
            });
            // res.data는 [{ bucket, temperature, humidity, ... }]
            const rows = (res?.data ?? []).map((d) => ({
                bucket: d.bucket,
                temperature: d.temperature,
                humidity: d.humidity,
            }));
            setData(rows);
        } catch (e) {
            setError(getErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [deviceId, preset, maxPoints]);

    useEffect(() => {
        load();
    }, [load]);

    const stats = useMemo(
        () => ({
            temperature: calcStats(data, 'temperature'),
            humidity: calcStats(data, 'humidity'),
        }),
        [data]
    );

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    const onDataPointClick = (_d: any, _t: number) => {
        // 필요 시 드릴다운 구현
    };

    return (
        <EnvPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={DEVICE_OPTIONS}
            column={column}
            setColumn={setColumn}
            zoomLevel={zoom}
            zoomLabel={label}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            canZoomIn={zoom > 0}
            canZoomOut={zoom < 3}
            onDataPointClick={onDataPointClick}
            onManualRefresh={load}
            data={data}
            stats={stats as any}
            loading={loading}
            error={error}
            logs={[]}
            peakLimits={{}}
            setPeakLimits={() => {}}
        />
    );
}
