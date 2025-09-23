// src/pages/Env/EnvContainer.tsx
/**
 * EnvContainer
 * - 모드: realtime (폴링) / range (전체 조회)
 * - fetchEnvQuery 사용, normalizeRows로 bucket -> epoch ms 변환 및 정렬
 * - 통계(calcStats)와 로그 관리를 포함
 */
// src/pages/Env/EnvContainer.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

export default function EnvContainer() {
    const [preset, setPreset] = useState<Preset>('1d');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [deviceId, setDeviceId] = useState<number | null>(21); // 기본 21
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200));

    const recompute = (rows: any[]) => {
        const temps = rows.map((r) => r.temperature).filter((v): v is number => v != null && Number.isFinite(v));
        const hums = rows.map((r) => r.humidity).filter((v): v is number => v != null && Number.isFinite(v));
        const calc = (arr: number[]) =>
            arr.length
                ? {
                      avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2),
                      max: Math.max(...arr),
                      min: Math.min(...arr),
                      count: arr.length,
                  }
                : { avg: null, max: null, min: null, count: 0 };
        setStats({ temperature: calc(temps), humidity: calc(hums) });
    };

    const pullOnce = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchEnvQuery({ preset: '15m', max_points: 200, device_id: deviceId ?? undefined });
            const rows = normalizeRows(res.data);
            if (rows.length) {
                setData((prev) => {
                    const next = [...prev.slice(-299), ...rows].slice(-300);
                    recompute(next);
                    return next;
                });
                log(`realtime ok device=${deviceId} t=${rows.at(-1)?.temperature} h=${rows.at(-1)?.humidity}`);
            } else {
                // 데이터 없음도 상태 갱신
                setData([]);
                setStats({});
                log(`realtime empty device=${deviceId}`);
            }
            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    const queryRange = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchEnvQuery({ preset, max_points: 1000, device_id: deviceId ?? undefined });
            const rows = normalizeRows(res.data);
            setData(rows);
            recompute(rows);
            log(`range ok device=${deviceId} n=${rows.length}`);
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
    }, [preset, deviceId]);

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
            deviceId={deviceId}
            setDeviceId={setDeviceId}
        />
    );
}
