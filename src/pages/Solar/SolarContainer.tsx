/**
 * SolarContainer.tsx
 *
 * 역할:
 * - 일사량 페이지의 데이터 로직을 담당.
 * - device 선택, preset, realtime/range, polling 관리.
 * - fetchSolarQuery 사용, normalizeRows로 bucket 표준화.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

export default function SolarContainer() {
    const [deviceId, setDeviceId] = useState<number | null>(21);
    const [preset, setPreset] = useState<Preset>('1d');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const deviceOptions = [21, 22, 23];

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-300));

    const calcStats = (arr: (number | null | undefined)[]) => {
        const nums = arr.filter((v): v is number => v != null && Number.isFinite(v));
        if (!nums.length) return { avg: null, max: null, min: null, count: 0 };
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
            avg: +(sum / nums.length).toFixed(2),
            max: Math.max(...nums),
            min: Math.min(...nums),
            count: nums.length,
        };
    };

    const recompute = useCallback((rows: any[]) => setStats({ solar: calcStats(rows.map((r) => r.solar)) }), []);

    const pullOnce = useCallback(async () => {
        try {
            const res = await fetchSolarQuery({ preset: '15m', max_points: 1, device_id: deviceId ?? undefined });
            const raw = Array.isArray(res.data) ? res.data : [];
            const rows = normalizeRows(raw);
            if (rows.length) {
                const last = rows[rows.length - 1];
                // ensure bucket is epoch(ms) and solar is number|null
                const bucket =
                    typeof last.bucket === 'number'
                        ? last.bucket
                        : last.bucket
                        ? Date.parse(String(last.bucket))
                        : Date.now();
                const sVal = last.solar ?? last.solar_irradiance_wm2 ?? null;
                const solar = sVal == null ? null : typeof sVal === 'number' ? sVal : Number(sVal);
                const row = { bucket, solar };
                setData((prev) => {
                    const next = [...prev.slice(-299), row];
                    recompute(next);
                    return next;
                });
                log(`realtime ok device=${deviceId} s=${solar}`);
            } else {
                setData([]);
                setStats({});
                log(`realtime empty device=${deviceId}`);
            }
            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        }
    }, [deviceId, recompute]);

    const queryRange = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSolarQuery({ preset, max_points: 1000, device_id: deviceId ?? undefined });
            const raw = Array.isArray(res.data) ? res.data : [];
            const rows = normalizeRows(raw);
            const norm = rows.map((r: any) => {
                const candidate = r.solar ?? r.solar_irradiance_wm2 ?? null;
                const v = candidate == null ? null : typeof candidate === 'number' ? candidate : Number(candidate);
                return { ...r, solar: v };
            });
            setData(norm);
            recompute(norm);
            log(`range ok device=${deviceId} n=${norm.length}`);
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
    }, [deviceId, preset, recompute]);

    useEffect(() => {
        window.clearInterval(timer.current);
        if (mode === 'realtime') {
            pullOnce();
            timer.current = window.setInterval(pullOnce, 5000);
        }
        return () => window.clearInterval(timer.current);
    }, [mode, pullOnce]);

    return (
        <SolarPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={deviceOptions}
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
