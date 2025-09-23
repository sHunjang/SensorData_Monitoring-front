// src/pages/Solar/SolarContainer.tsx
/**
 * SolarContainer
 * - EnvContainer와 동일한 패턴으로 동작
 * - fetchSolarQuery -> normalizeRows -> stats 계산
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';
type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

function calcStats(values: (number | null | undefined)[]): Stat {
    const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
    if (!nums.length) return { avg: null, max: null, min: null, count: 0 };
    const sum = nums.reduce((a, b) => a + b, 0);
    return { avg: +(sum / nums.length).toFixed(2), max: Math.max(...nums), min: Math.min(...nums), count: nums.length };
}

export default function SolarContainer() {
    const [preset, setPreset] = useState<Preset>('1d');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<Record<string, Stat>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200));

    const recompute = useCallback((rows: any[]) => {
        setStats({ solar: calcStats(rows.map((r) => r?.solar)) });
    }, []);

    const pullOnce = useCallback(async () => {
        try {
            const res = await fetchSolarQuery({ preset: '15m', max_points: 200 });
            const rows = normalizeRows(res.data);
            if (rows.length) {
                setData((prev) => {
                    const next = [...prev.slice(-299), ...rows].slice(-300);
                    recompute(next);
                    return next;
                });
                log(`realtime ok s=${rows.at(-1)?.solar}`);
            }
            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        }
    }, [recompute]);

    const queryRange = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchSolarQuery({ preset, max_points: 1000 });
            const rows = normalizeRows(res.data);
            setData(rows);
            recompute(rows);
            log(`range ok ${preset} n=${rows.length}`);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            setData([]);
            setStats({});
            log(`range error ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [preset, recompute]);

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
            mode={mode}
            setMode={setMode}
            preset={preset}
            setPreset={setPreset}
            onQuery={mode === 'realtime' ? pullOnce : queryRange}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
        />
    );
}
