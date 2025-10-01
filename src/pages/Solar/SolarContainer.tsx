/**
 * SolarContainer.tsx
 * - 목적: SolarPresenter에 전달할 데이터 로드 및 상태 관리
 * - 설계:
 *   - 4단계 줌(1h, 1d, 1w, 1mo) 지원
 *   - 각 줌별 preset, label, realtime 여부, maxPoints, 폴링 주기(intervalMs) 설정
 *   - fetchSolarQuery({ deviceid, preset, maxpoints }) 호출로 데이터 수신
 *   - 데이터 매핑과 stats 계산 제공
 *   - 드릴다운: 1mo -> 1w -> 1d -> 1h
 *
 * 주의:
 * - 백엔드는 bucket을 ISO 문자열로 반환해야 함 (get_cursor 기반 라우터 적용).
 * - realtime이 true인 경우 지정된 interval로 폴링.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

type ZoomLevel = 0 | 1 | 2 | 3;
type Preset = '1h' | '1d' | '1w' | '1mo';

const ZOOMS: Record<
    ZoomLevel,
    { preset: Preset; label: string; realtime: boolean; maxPoints: number; intervalMs: number }
> = {
    0: { preset: '1h', label: '1시간', realtime: true, maxPoints: 60, intervalMs: 30000 },
    1: { preset: '1d', label: '1일', realtime: true, maxPoints: 1440, intervalMs: 60000 },
    2: { preset: '1w', label: '1주', realtime: false, maxPoints: 336, intervalMs: 60000 },
    3: { preset: '1mo', label: '1개월', realtime: false, maxPoints: 31, intervalMs: 60000 },
};

const DEVICE_OPTIONS = [31];

/**
 * calcStats
 * - 단일 컬럼(irradiance)에 대한 평균/최대/최소/카운트 계산
 */
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

/**
 * MAP: API row -> chart row 변환기
 * - 서버가 반환하는 필드(irradiance, bucket)를 그대로 사용.
 * - bucket은 ISO 문자열(또는 Date로 파싱 가능한 값)이어야 함.
 */
const MAP = (row: any) => ({
    bucket: row.bucket,
    irradiance: typeof row.irradiance === 'number' && Number.isFinite(row.irradiance) ? row.irradiance : null,
});

export default function SolarContainer() {
    const [deviceId, setDeviceId] = useState<number>(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(0); // 기본 1시간
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);

    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({ solar: 1000 });

    const config = ZOOMS[zoom];

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    /**
     * load
     * - fetchSolarQuery를 호출해서 데이터를 받아 MAP으로 변환하고 상태에 저장
     */
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchSolarQuery({
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
        } finally {
            setLoading(false);
        }
    }, [deviceId, config, log]);

    // 마운트 및 zoom 변경 시 로드, realtime이면 interval 등록
    useEffect(() => {
        load();
        // 기존 타이머 정리
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }
        if (config.realtime) {
            timerRef.current = window.setInterval(load, config.intervalMs) as unknown as number;
            log(`Realtime polling every ${config.intervalMs}ms (${config.label})`);
        } else {
            log(`${config.label} static mode`);
        }
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log]);

    const stats = useMemo(() => calcStats(data), [data]);

    // 줌 제어
    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    /**
     * onDataPointClick
     * - 드릴다운 경로 고정: 1mo -> 1w -> 1d -> 1h
     * - 더 세밀한 드릴다운은 Modbus와 동일하게 구성 가능
     */
    const onDataPointClick = (d: any, t: number) => {
        if (zoom === 3) setZoom(2);
        else if (zoom === 2) setZoom(1);
        else if (zoom === 1) setZoom(0);
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
            canZoomOut={zoom < 3}
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
