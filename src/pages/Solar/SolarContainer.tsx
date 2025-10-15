import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

// 타입 정의
type Preset = '1day' | '1week' | '1month' | '1year';
type ZoomLevel = 0 | 1 | 2 | 3;

// ZOOM 설정
const ZOOMS: Record<
    ZoomLevel,
    { preset: Preset; label: string; realtime: boolean; maxPoints: number; intervalMs: number }
> = {
    0: { preset: '1day', label: '1일', realtime: true, maxPoints: 1440, intervalMs: 60000 },
    1: { preset: '1week', label: '1주', realtime: true, maxPoints: 672, intervalMs: 900000 },
    2: { preset: '1month', label: '1개월', realtime: false, maxPoints: 720, intervalMs: 3600000 },
    3: { preset: '1year', label: '1년', realtime: false, maxPoints: 365, intervalMs: 86400000 },
};

const DEVICE_OPTIONS = [31];

// 통계 계산
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

// 데이터 매핑
const MAP = (row: any) => ({
    bucket: row.bucket,
    irradiance: row.avg_irradiance ?? null,
    min_irradiance: row.min_irradiance ?? null,
    max_irradiance: row.max_irradiance ?? null,
});

// 헬퍼 함수
function toIsoLocal(value?: string | null) {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

function toLocalInputString(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
    )}`;
}

export default function SolarContainer() {
    const [deviceId, setDeviceId] = useState(DEVICE_OPTIONS[0]);
    const [zoom, setZoom] = useState<ZoomLevel>(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const timerRef = useRef<number | undefined>(undefined);
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({ solar: 1000 });
    const [startAt, setStartAt] = useState<string | null>(null);
    const [endAt, setEndAt] = useState<string | null>(null);
    const isRangeMode = Boolean(startAt && endAt);
    const config = ZOOMS[zoom];

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    const load = useCallback(
        async (opts?: { start?: string; end?: string }) => {
            setLoading(true);
            setError(null);
            try {
                const params: any = {
                    deviceid: deviceId,
                    preset: config.preset,
                    maxpoints: config.maxPoints,
                };
                if (opts?.start) params.start = opts.start;
                if (opts?.end) params.end = opts.end;

                const res = await fetchSolarQuery(params);
                const rows = (res?.data ?? []).map(MAP);
                setData(rows);
                log(
                    `로드 완료: ${rows.length}건 (${config.label}, ${res.resolution})${opts?.start ? ' 범위 모드' : ''}`
                );
            } catch (e) {
                const m = getErrorMessage(e);
                setError(m);
                setData([]);
                log(`로드 오류: ${m}`);
            } finally {
                setLoading(false);
            }
        },
        [deviceId, config, log]
    );

    useEffect(() => {
        const sIso = toIsoLocal(startAt);
        const eIso = toIsoLocal(endAt);
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }

        if (isRangeMode) {
            load({ start: sIso!, end: eIso! });
            log(`범위 모드: ${sIso} ~ ${eIso}`);
            return;
        }

        load();
        if (config.realtime) {
            timerRef.current = window.setInterval(() => load(), config.intervalMs) as unknown as number;
            log(`실시간 폴링 ${config.intervalMs}ms`);
        } else {
            log(`${config.label} 정적 모드`);
        }

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log, startAt, endAt, isRangeMode]);

    const stats = useMemo(() => calcStats(data), [data]);

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    // ============================================================
    // ✅ 좌/우 이동: 현재 줌 레벨(1일/1주/1개월/1년)에 맞춰 이동
    // ============================================================

    const panLeft = useCallback(() => {
        let sIso: string;
        let eIso: string;

        // ✅ 현재 범위가 있으면 그 기준으로 이동
        if (startAt && endAt) {
            const currentStart = new Date(startAt);
            const currentEnd = new Date(endAt);

            if (config.preset === '1day') {
                // 현재 표시된 날짜의 전날
                const prevDayStart = new Date(currentStart);
                prevDayStart.setDate(currentStart.getDate() - 1);
                prevDayStart.setHours(0, 0, 0, 0);

                const prevDayEnd = new Date(prevDayStart);
                prevDayEnd.setHours(23, 59, 59, 999);

                sIso = prevDayStart.toISOString();
                eIso = prevDayEnd.toISOString();
            } else if (config.preset === '1week') {
                // 현재 표시된 주의 지난주
                const prevWeekStart = new Date(currentStart);
                prevWeekStart.setDate(currentStart.getDate() - 7);

                const prevWeekEnd = new Date(currentEnd);
                prevWeekEnd.setDate(currentEnd.getDate() - 7);

                sIso = prevWeekStart.toISOString();
                eIso = prevWeekEnd.toISOString();
            } else if (config.preset === '1month') {
                // 현재 표시된 달의 지난달
                const prevMonthStart = new Date(currentStart);
                prevMonthStart.setMonth(currentStart.getMonth() - 1);

                const prevMonthEnd = new Date(prevMonthStart);
                prevMonthEnd.setMonth(prevMonthStart.getMonth() + 1);
                prevMonthEnd.setDate(0); // 지난달 마지막 날
                prevMonthEnd.setHours(23, 59, 59, 999);

                sIso = prevMonthStart.toISOString();
                eIso = prevMonthEnd.toISOString();
            } else if (config.preset === '1year') {
                // 현재 표시된 연도의 작년
                const prevYearStart = new Date(currentStart);
                prevYearStart.setFullYear(currentStart.getFullYear() - 1);

                const prevYearEnd = new Date(prevYearStart);
                prevYearEnd.setMonth(11, 31);
                prevYearEnd.setHours(23, 59, 59, 999);

                sIso = prevYearStart.toISOString();
                eIso = prevYearEnd.toISOString();
            } else {
                return;
            }
        } else {
            // ✅ 범위가 없으면 오늘 기준
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (config.preset === '1day') {
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                yesterday.setHours(0, 0, 0, 0);

                sIso = yesterday.toISOString();

                const yesterdayEnd = new Date(yesterday);
                yesterdayEnd.setHours(23, 59, 59, 999);
                eIso = yesterdayEnd.toISOString();
            } else if (config.preset === '1week') {
                const weekday = today.getDay();
                const thisMonday = new Date(today);
                thisMonday.setDate(today.getDate() - ((weekday + 6) % 7));
                thisMonday.setHours(0, 0, 0, 0);

                const lastMonday = new Date(thisMonday);
                lastMonday.setDate(thisMonday.getDate() - 7);

                const lastSunday = new Date(thisMonday);
                lastSunday.setDate(thisMonday.getDate() - 1);
                lastSunday.setHours(23, 59, 59, 999);

                sIso = lastMonday.toISOString();
                eIso = lastSunday.toISOString();
            } else if (config.preset === '1month') {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();

                let lastMonthYear = year;
                let lastMonth = month - 1;
                if (lastMonth < 0) {
                    lastMonth = 11;
                    lastMonthYear -= 1;
                }

                const firstDay = new Date(lastMonthYear, lastMonth, 1, 0, 0, 0, 0);
                const lastDay = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);

                sIso = firstDay.toISOString();
                eIso = lastDay.toISOString();
            } else if (config.preset === '1year') {
                const now = new Date();
                const lastYear = now.getFullYear() - 1;

                const firstDay = new Date(lastYear, 0, 1, 0, 0, 0, 0);
                const lastDay = new Date(lastYear, 11, 31, 23, 59, 59, 999);

                sIso = firstDay.toISOString();
                eIso = lastDay.toISOString();
            } else {
                return;
            }
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
        log(`좌 이동: ${config.label} 단위`);
    }, [config, log, startAt, endAt]); // ✅ startAt, endAt 의존성 추가

    const panRight = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        // ✅ 현재 범위가 있으면 그 기준으로 이동
        if (startAt && endAt) {
            const currentStart = new Date(startAt);
            const currentEnd = new Date(endAt);

            if (config.preset === '1day') {
                // 현재 표시된 날짜의 다음날
                const nextDayStart = new Date(currentStart);
                nextDayStart.setDate(currentStart.getDate() + 1);
                nextDayStart.setHours(0, 0, 0, 0);

                const nextDayEnd = new Date(nextDayStart);
                nextDayEnd.setHours(23, 59, 59, 999);

                // ✅ 다음날 시작이 오늘보다 미래면 차단
                if (nextDayStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextDayStart.toISOString();
                eIso = nextDayEnd.toISOString();
            } else if (config.preset === '1week') {
                // 현재 표시된 주의 다음주
                const nextWeekStart = new Date(currentStart);
                nextWeekStart.setDate(currentStart.getDate() + 7);

                const nextWeekEnd = new Date(currentEnd);
                nextWeekEnd.setDate(currentEnd.getDate() + 7);

                // ✅ 다음주 시작이 오늘보다 미래면 차단
                if (nextWeekStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextWeekStart.toISOString();
                eIso = nextWeekEnd.toISOString();
            } else if (config.preset === '1month') {
                // 현재 표시된 달의 다음달
                const nextMonthStart = new Date(currentStart);
                nextMonthStart.setMonth(currentStart.getMonth() + 1);

                const nextMonthEnd = new Date(nextMonthStart);
                nextMonthEnd.setMonth(nextMonthStart.getMonth() + 1);
                nextMonthEnd.setDate(0); // 다음달 마지막 날
                nextMonthEnd.setHours(23, 59, 59, 999);

                // ✅ 다음달 시작이 오늘보다 미래면 차단
                if (nextMonthStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextMonthStart.toISOString();
                eIso = nextMonthEnd.toISOString();
            } else if (config.preset === '1year') {
                // 현재 표시된 연도의 다음해
                const nextYearStart = new Date(currentStart);
                nextYearStart.setFullYear(currentStart.getFullYear() + 1);

                const nextYearEnd = new Date(nextYearStart);
                nextYearEnd.setMonth(11, 31);
                nextYearEnd.setHours(23, 59, 59, 999);

                // ✅ 다음해 시작이 오늘보다 미래면 차단
                if (nextYearStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextYearStart.toISOString();
                eIso = nextYearEnd.toISOString();
            } else {
                return;
            }
        } else {
            // ✅ 범위가 없으면 오늘로 돌아가기
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (config.preset === '1day') {
                sIso = today.toISOString();
                const todayEnd = new Date(today);
                todayEnd.setHours(23, 59, 59, 999);
                eIso = todayEnd.toISOString();
            } else if (config.preset === '1week') {
                const weekday = today.getDay();
                const thisMonday = new Date(today);
                thisMonday.setDate(today.getDate() - ((weekday + 6) % 7));
                thisMonday.setHours(0, 0, 0, 0);

                const thisSunday = new Date(thisMonday);
                thisSunday.setDate(thisMonday.getDate() + 6);
                thisSunday.setHours(23, 59, 59, 999);

                sIso = thisMonday.toISOString();
                eIso = thisSunday.toISOString();
            } else if (config.preset === '1month') {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

                sIso = firstDay.toISOString();
                eIso = lastDay.toISOString();
            } else if (config.preset === '1year') {
                const firstDay = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
                const lastDay = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

                sIso = firstDay.toISOString();
                eIso = lastDay.toISOString();
            } else {
                return;
            }
        }

        setStartAt(toLocalInputString(new Date(sIso)));
        setEndAt(toLocalInputString(new Date(eIso)));
        log(`우 이동: ${config.label} 단위`);
    }, [config, log, startAt, endAt]); // ✅ 의존성에 startAt, endAt 추가

    const setRelativeRange = (minutes: number) => {
        const end = new Date();
        const start = new Date(end.getTime() - minutes * 60 * 1000);
        setStartAt(toLocalInputString(start));
        setEndAt(toLocalInputString(end));
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
            onDataPointClick={(_d, _t) => {
                if (zoom === 3) setZoom(2);
                else if (zoom === 2) setZoom(1);
                else if (zoom === 1) setZoom(0);
            }}
            onManualRefresh={() => {
                const s = toIsoLocal(startAt);
                const e = toIsoLocal(endAt);
                if (s && e) load({ start: s, end: e });
                else load();
            }}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits}
            startAt={startAt}
            endAt={endAt}
            setStartAt={setStartAt}
            setEndAt={setEndAt}
            setRelativeRange={setRelativeRange}
            isRangeMode={isRangeMode}
            panLeft={panLeft}
            panRight={panRight}
        />
    );
}
