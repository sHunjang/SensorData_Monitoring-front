import { jsx as _jsx } from "react/jsx-runtime";
// src/pages/Solar/SolarContainer.tsx
/**
 * SolarContainer
 *
 * - 서버에서 일사량 시계열을 조회하고 차트에 전달한다.
 * - 핵심: 서버의 bucket(ISO string)을 epoch(ms) 숫자로 정규화하고
 *         React state에 숫자 타입만 들어가도록 강제한다.
 * - 주석의 변경점: setData 시 safeRows 생성(타입 강제, 필터, 정렬)
 *
 * 붙여넣기 후 정상동작하면 끝.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';
export default function SolarContainer() {
    const [deviceId, setDeviceId] = useState(1);
    const [preset, setPreset] = useState('15m');
    const [mode, setMode] = useState('realtime');
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const timerRef = useRef(undefined);
    const deviceOptions = [1]; // 필요시 장치 목록 업데이트
    const log = (m) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${m}`].slice(-200));
    const calcStats = useCallback((rows) => {
        const vals = rows
            .map((r) => r.solar)
            .filter((v) => v != null)
            .map((v) => Number(v));
        if (!vals.length) {
            setStats({});
            return;
        }
        const sum = vals.reduce((a, b) => a + b, 0);
        setStats({
            solar: {
                avg: +(sum / vals.length).toFixed(2),
                max: Math.max(...vals),
                min: Math.min(...vals),
                count: vals.length,
            },
        });
    }, []);
    const pullOnce = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchSolarQuery({ preset: preset, max_points: 200, device_id: deviceId ?? undefined });
            const raw = Array.isArray(res?.data) ? res.data : [];
            let rows = normalizeRows(raw);
            // --- 안전: 타입 보장, 필터, 정렬 (차트에 들어가는 최종 데이터)
            const safeRows = rows
                .map((r) => ({
                ...r,
                bucket: r.bucket == null ? null : Number(r.bucket),
                solar: r.solar == null ? null : Number(r.solar),
                device_id: r.device_id == null ? null : Number(r.device_id),
            }))
                .filter((r) => typeof r.bucket === 'number'); // 차트 렌더용 유효 항목만
            // 시간순 정렬(오름차순)
            safeRows.sort((a, b) => a.bucket - b.bucket);
            setData(safeRows);
            calcStats(safeRows);
            setError(null);
            log(`range fetch ok device=${deviceId} solar=${rows.at(-1)?.solar}`);
        }
        catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`realtime error ${msg}`);
        }
        finally {
            setLoading(false);
        }
    }, [deviceId]);
    useEffect(() => {
        window.clearInterval(timerRef.current);
        if (mode === 'realtime') {
            pullOnce();
            timerRef.current = window.setInterval(() => {
                pullOnce();
            }, 500);
        }
        return () => {
            window.clearInterval(timerRef.current);
        };
    }, [mode, pullOnce]);
    const onQuery = useCallback(() => {
        pullOnce();
    }, [pullOnce]);
    return (_jsx(SolarPresenter, { deviceId: deviceId, setDeviceId: setDeviceId, deviceOptions: deviceOptions, preset: preset, setPreset: setPreset, mode: mode, setMode: setMode, onQuery: onQuery, data: data, stats: stats, loading: loading, error: error, logs: logs }));
}
