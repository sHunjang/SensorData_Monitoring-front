// src/pages/Modbus/ModbusContainer.tsx
/**
 * ModbusContainer
 * - device 선택, series(column) 선택, mode(realtime/range)
 * - realtime: fetchRealtime -> metricKey 매핑 -> row 생성 (bucket epoch ms)
 * - range: fetchModbusQuery -> normalizeRows 적용
 * - setData는 함수형 업데이트로 동기성 이슈 방지
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery, fetchRealtime } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';
type SeriesKey = 'power' | 'current' | 'voltage' | 'energy' | 'pf';

function metricKeyForColumn(col: SeriesKey) {
    switch (col) {
        case 'power':
            return 'p_kw';
        case 'energy':
            return 'e_kwh';
        case 'voltage':
            return 'v_avg';
        case 'current':
            return 'i_sum';
        case 'pf':
            return 'pf';
        default:
            return col;
    }
}

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState<number>(11);
    const [column, setColumn] = useState<SeriesKey>('power');
    const [preset, setPreset] = useState<Preset>('1d');
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timer = useRef<number | undefined>(undefined);

    const log = (m: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200));

    const recompute = useCallback(
        (rows: any[]) => {
            const vals = rows.map((r) => r[column]).filter((v): v is number => v != null && Number.isFinite(v));
            if (!vals.length) {
                setStats({});
                return;
            }
            const sum = vals.reduce((a, b) => a + b, 0);
            setStats({
                [column]: {
                    avg: +(sum / vals.length).toFixed(3),
                    max: Math.max(...vals),
                    min: Math.min(...vals),
                    count: vals.length,
                },
            });
        },
        [column]
    );

    const pullOnce = useCallback(async () => {
        try {
            const r = await fetchRealtime(deviceId);
            const metricKey = metricKeyForColumn(column);
            const value = r?.metrics?.[metricKey] ?? null;
            const bucketEpoch = r?.time_stamp ? Date.parse(r.time_stamp) : null;

            const row = {
                bucket: bucketEpoch,
                [column]: typeof value === 'number' ? value : value == null ? null : Number(value),
            };

            setData((prev) => {
                const next = [...prev.slice(-299), row];
                recompute(next);
                return next;
            });

            setError(null);
            log('realtime ok');
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        }
    }, [deviceId, column, recompute]);

    const queryRange = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchModbusQuery({ device_id: deviceId, series: [column], preset, max_points: 1000 });
            const rows = normalizeRows(res.data);
            // ensure numeric series values
            const norm = rows.map((r) => ({ ...r, [column]: r[column] == null ? null : Number(r[column]) }));
            setData(norm);
            recompute(norm);
            log(`range ok ${preset} n=${norm.length}`);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            setData([]);
            setStats({});
            log(`range error ${msg}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId, column, preset, recompute]);

    useEffect(() => {
        window.clearInterval(timer.current);
        if (mode === 'realtime') {
            pullOnce();
            timer.current = window.setInterval(pullOnce, 5000);
        }
        return () => window.clearInterval(timer.current);
    }, [mode, pullOnce]);

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            column={column}
            setColumn={setColumn}
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
