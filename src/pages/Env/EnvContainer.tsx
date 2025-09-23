// src/pages/Env/EnvContainer.tsx
/**
 * EnvContainer
 * - 모드: realtime (폴링) / range (전체 조회)
 * - fetchEnvQuery 사용, normalizeRows로 bucket -> epoch ms 변환 및 정렬
 * - 통계(calcStats)와 로그 관리를 포함
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
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

export default function EnvContainer() {
    const [preset, setPreset] = useState<Preset>('1d');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200));

    const recompute = useCallback((rows: any[]) => {
        setStats({
            temperature: calcStats(rows.map((r) => r?.temperature)),
            humidity: calcStats(rows.map((r) => r?.humidity)),
        });
    }, []);

    const pullOnce = useCallback(async () => {
        try {
            const res = await fetchEnvQuery({ preset: '15m', max_points: 200 });
            const rows = normalizeRows(res.data);
            if (rows.length) {
                setData((prev) => {
                    const next = [...prev.slice(-299), ...rows].slice(-300);
                    recompute(next);
                    return next;
                });
                log(`realtime ok t=${rows.at(-1)?.temperature} h=${rows.at(-1)?.humidity}`);
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
            const res = await fetchEnvQuery({ preset, max_points: 1000 });
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
        <EnvPresenter
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
