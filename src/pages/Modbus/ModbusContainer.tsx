// src/pages/Modbus/ModbusContainer.tsx
// - total* 컬럼을 차트 키로 변환(activepower, reactivepower, apparentpower 등)
// - 4단계 줌만 지원(1h/1d/1w/1mo)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';

type ZoomLevel = 0 | 1 | 2 | 3;
type ZoomPreset = '1h' | '1d' | '1w' | '1mo';

const ZOOMS: Record<ZoomLevel, { preset: ZoomPreset; label: string; realtime: boolean; maxPoints: number }> = {
    0: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60 },
    1: { preset: '1d', label: '1일', realtime: true, maxPoints: 1440 },
    2: { preset: '1w', label: '1주', realtime: false, maxPoints: 336 },
    3: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 31 },
};

const DEVICE_OPTIONS = [11, 12, 13, 14, 15];

const MAP = (row: any) => ({
    bucket: row.bucket,
    activepower: row.totalactivepowerkw ?? null,
    reactivepower: row.totalreactivepowerkvar ?? null,
    apparentpower: row.totalapparentpowerkva ?? null,
    voltagell: row.avglinetolinevoltsv ?? null,
    voltageln: row.avglinetoneutralvoltsv ?? null,
    current: row.sumlinecurrentsa ?? null,
    powerfactor: row.totalpowerfactor ?? null,
    activeenergy: row.totalactiveenergykwh ?? null,
    reactiveenergy: row.totalreactiveenergykvarh ?? null,
    apparentenergy: row.totalapparentenergykvah ?? null,
});

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
    const [zoom, setZoom] = useState<ZoomLevel>(0);
    const [column, setColumn] = useState<string>('activepower');

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { preset, label, maxPoints } = ZOOMS[zoom];

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchModbusQuery({
                deviceid: deviceId,
                preset,
                maxpoints: maxPoints,
            });
            const rows = (res?.data ?? []).map(MAP);
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

    const stats = useMemo(() => {
        const allKeys = [
            'activepower',
            'reactivepower',
            'apparentpower',
            'voltagell',
            'voltageln',
            'current',
            'powerfactor',
            'activeenergy',
            'reactiveenergy',
            'apparentenergy',
        ];
        const s: Record<string, any> = {};
        for (const k of allKeys) s[k] = calcStats(data, k);
        return s;
    }, [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    const onDataPointClick = (_d: any, _t: number) => {};

    return (
        <ModbusPresenter
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
