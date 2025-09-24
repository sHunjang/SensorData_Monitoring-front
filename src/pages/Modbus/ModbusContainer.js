import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ModbusContainer.tsx
 *
 * 역할:
 * - Modbus(전력량계) 페이지의 데이터 로직을 담당.
 * - realtime / range 모드, device/series 선택, preset 관리.
 * - API 호출(fetchModbusQuery, fetchRealtime), 응답 방어적 파싱, normalizeRows 사용.
 *
 * 주의:
 * - fetchModbusQuery, fetchRealtime이 src/api/modbus 에 있어야 함.
 * - normalizeRows는 bucket -> epoch(ms) 변환을 보장해야 함.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery, fetchRealtime } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';
export default function ModbusContainer() {
    // UI state
    const [deviceId, setDeviceId] = useState(11);
    const [column, setColumn] = useState('power');
    const [preset, setPreset] = useState('1d');
    const [mode, setMode] = useState('realtime');
    // data state
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const timer = useRef(undefined);
    const deviceOptions = [11, 12, 13]; // 필요 시 실제 장치 목록으로 교체
    const log = (m) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-300));
    // 간단 통계 계산 (avg/max/min/count)
    const recompute = useCallback((rows) => {
        const vals = rows.map((r) => r[column]).filter((v) => v != null && Number.isFinite(v));
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
    }, [column]);
    // realtime: fetchRealtime returns an object with time_stamp and metrics (defensive)
    const pullOnce = useCallback(async () => {
        try {
            const r = await fetchRealtime(deviceId);
            if (!r)
                throw new Error('empty realtime response');
            // metrics parsing (defensive)
            const metricMap = r.metrics ?? {};
            const metricKey = column === 'power' ? 'p_kw' : column === 'energy' ? 'e_kwh' : column;
            let rawVal = metricMap[metricKey] ?? metricMap[column] ?? null;
            const value = rawVal == null ? null : typeof rawVal === 'number' ? rawVal : Number(rawVal);
            // bucket: try time_stamp then fallback to Date.now()
            const raw = r; // 넘어오는 응답이 다양한 스키마일 수 있으므로 방어적으로 처리
            const tsCandidate = raw?.time_stamp ?? raw?.timestamp ?? raw?.time ?? null;
            let bucket;
            if (tsCandidate == null) {
                bucket = Date.now();
            }
            else if (typeof tsCandidate === 'number') {
                // already epoch ms or seconds? assume ms; if seconds, adjust where you create timestamps on server
                bucket = tsCandidate;
            }
            else if (typeof tsCandidate === 'string') {
                // ISO string with offset -> Date.parse가 잘 처리함
                bucket = Number.isNaN(Date.parse(tsCandidate)) ? Date.now() : Date.parse(tsCandidate);
            }
            else if (tsCandidate instanceof Date) {
                bucket = tsCandidate.getTime();
            }
            else {
                bucket = Date.now();
            }
            const row = { bucket, [column]: value };
            setData((prev) => {
                const next = [...prev.slice(-299), row];
                recompute(next);
                return next;
            });
            setError(null);
            log(`realtime ok device=${deviceId} col=${column} v=${value}`);
        }
        catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        }
    }, [deviceId, column, recompute]);
    // range query: fetchModbusQuery -> normalizeRows -> ensure column key exists
    const queryRange = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchModbusQuery({ device_id: deviceId, series: [column], preset, max_points: 1000 });
            const raw = Array.isArray(res.data) ? res.data : [];
            const rows = normalizeRows(raw); // normalizeRows should convert bucket -> epoch(ms)
            const norm = rows.map((r) => {
                // fallback keys mapping: requested column or metric-key-like names
                const candidate = r[column] ??
                    r.p_kw ??
                    r.e_kwh ??
                    r[Object.keys(r).find((k) => k.includes(column))] ??
                    null;
                const v = candidate == null ? null : typeof candidate === 'number' ? candidate : Number(candidate);
                return { ...r, [column]: v };
            });
            setData(norm);
            recompute(norm);
            log(`range ok device=${deviceId} preset=${preset} n=${norm.length}`);
            setError(null);
        }
        catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            setData([]);
            setStats({});
            log(`range error ${msg}`);
        }
        finally {
            setLoading(false);
        }
    }, [deviceId, column, preset, recompute]);
    // polling management
    useEffect(() => {
        window.clearInterval(timer.current);
        if (mode === 'realtime') {
            pullOnce();
            timer.current = window.setInterval(pullOnce, 5000);
        }
        return () => window.clearInterval(timer.current);
    }, [mode, pullOnce]);
    return (_jsx(ModbusPresenter, { deviceId: deviceId, setDeviceId: setDeviceId, deviceOptions: deviceOptions, column: column, setColumn: setColumn, preset: preset, setPreset: setPreset, mode: mode, setMode: setMode, onQuery: mode === 'realtime' ? pullOnce : queryRange, data: data, stats: stats, loading: loading, error: error, logs: logs }));
}
