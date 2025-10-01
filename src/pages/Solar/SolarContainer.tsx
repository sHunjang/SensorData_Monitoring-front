// src/pages/Solar/SolarContainer.tsx
// - 4단계 줌(1h/1d/1w/1mo)만 지원
// - API 파라미터는 deviceid/maxpoints로 통일

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

type ZoomLevel = 0 | 1 | 2 | 3;
type ZoomPreset = '1h' | '1d' | '1w' | '1mo';

const ZOOMS: Record<ZoomLevel, { preset: ZoomPreset; label: string; realtime: boolean; maxPoints: number }> = {
    0: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60 },
    1: { preset: '1d', label: '1일', realtime: true, maxPoints: 1440 },
    2: { preset: '1w', label: '1주', realtime: false, maxPoints: 336 },
    3: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 31 },
};

const DEVICE_OPTIONS = [31, 32, 33];

function calcStats(rows: any[]) {
    const nums = rows
        .map((r) => r?.irradiance)
        .filter((v: any) => typeof v === 'number' && Number.isFinite(v)) as number[];
    if (!nums.length) return { avg: null, max: null, min: null, count: 0 };
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
        avg: Number((sum / nums.length).toFixed(2)),
        max: Math.max(...nums),
        min: Math.min(...nums),
        count: nums.length,
    };
}

export default function SolarContainer() {
    const [deviceId, setDeviceId] = useState(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { preset, label, maxPoints } = ZOOMS[zoom];

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchSolarQuery({
                deviceid: deviceId,
                preset,
                maxpoints: maxPoints,
            });
            // res.data는 [{ bucket, irradiance, ... }]
            const rows = (res?.data ?? []).map((d: any) => ({
                bucket: d.bucket,
                irradiance: d.irradiance,
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

    const stats = useMemo(() => calcStats(data), [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));
    const onDataPointClick = (_d: any, _t: number) => {
        // 필요 시 드릴다운 구현
    };

    return (
        <SolarPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={DEVICE_OPTIONS}
            zoomLevel={zoom}
            zoomLabel={label}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            canZoomIn={zoom > 0}
            canZoomOut={zoom < 3}
            onDataPointClick={onDataPointClick}
            onManualRefresh={load}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={[]}
        />
    );
}
