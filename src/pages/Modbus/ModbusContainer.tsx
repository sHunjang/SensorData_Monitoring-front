import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery, fetchTotalEnergy } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';

// ============================================================
// 타입 정의
// ============================================================

/** API 프리셋: 1일/1주/1개월/1년 */
type Preset = '1day' | '1week' | '1month' | '1year';

/** 줌 레벨: 0=1일, 1=1주, 2=1개월, 3=1년 */
type ZoomLevel = 0 | 1 | 2 | 3;

// ============================================================
// 줌 설정: 각 레벨별 API 호출 설정
// ============================================================
const ZOOMS: Record<
    ZoomLevel,
    {
        preset: Preset;
        label: string;
        realtime: boolean;
        maxPoints: number;
        intervalMs: number;
    }
> = {
    0: { preset: '1day', label: '1일', realtime: true, maxPoints: 1440, intervalMs: 60000 },
    1: { preset: '1week', label: '1주', realtime: true, maxPoints: 672, intervalMs: 900000 },
    2: { preset: '1month', label: '1개월', realtime: false, maxPoints: 720, intervalMs: 3600000 },
    3: { preset: '1year', label: '1년', realtime: false, maxPoints: 365, intervalMs: 86400000 },
};

/** 조회 가능한 디바이스 ID 목록 (전력량계 11~15번) */
const DEVICE_OPTIONS = [11, 12, 13, 14, 15];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * API 응답 데이터를 프론트엔드 형식으로 변환
 */
const MAP = (row: any) => {
    console.log('[MAP] Input row:', row);

    const mapped = {
        bucket: row.bucket,

        // 전력 데이터
        active_power: row.power ?? null,
        reactive_power: row.reactive_power ?? null,
        apparent_power: row.apparent_power ?? null,

        // 전압
        voltage_ll: row.voltage ?? null,
        voltage_ln: row.voltage ?? null,

        // 전류
        current: row.current ?? null,

        // 역률
        power_factor: row.power_factor ?? null,

        // 전력량
        active_energy: row.energy_delta ?? null, // 1분간 소비량
        total_energy: row.total_energy ?? null, // ✅ 추가: 총 누적량
        reactive_energy: row.reactive_energy ?? null,
        apparent_energy: row.apparent_energy ?? null,

        // 피크 전력
        peak_power: row.peak_power ?? null,
    };

    console.log('[MAP] Mapped row:', mapped);
    return mapped;
};

/**
 * 데이터 배열에서 지정된 키의 통계 계산
 */
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

/**
 * datetime-local input 값을 ISO 8601 형식으로 변환
 */
function toIsoLocal(value?: string | null) {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

/**
 * Date 객체를 datetime-local input 형식으로 변환
 */
function toLocalInputString(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
    )}`;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export default function ModbusContainer() {
    // ------------------------------------------------------------
    // 상태 관리
    // ------------------------------------------------------------

    /** 선택된 디바이스 ID (기본값: 11번) */
    const [deviceId, setDeviceId] = useState(DEVICE_OPTIONS[0]);

    /** 현재 줌 레벨 (0=1일, 1=1주, 2=1개월, 3=1년) */
    const [zoom, setZoom] = useState<ZoomLevel>(0);

    /** 현재 선택된 그래프 컬럼 */
    const [column, setColumn] = useState<
        | 'active_power'
        | 'reactive_power'
        | 'apparent_power'
        | 'voltage_ll'
        | 'voltage_ln'
        | 'current'
        | 'power_factor'
        | 'active_energy'
        | 'total_energy' // ✅ 추가: 총 누적 전력량
        | 'reactive_energy'
        | 'apparent_energy'
    >('active_power');

    /** API로부터 받은 데이터 배열 */
    const [data, setData] = useState<any>([]);

    /** 로딩 상태 */
    const [loading, setLoading] = useState(false);

    /** 에러 메시지 */
    const [error, setError] = useState<string | null>(null);

    /** 디버깅용 로그 배열 */
    const [logs, setLogs] = useState<string[]>([]);

    /** 실시간 폴링 타이머 ref */
    const timerRef = useRef<number | undefined>(undefined);

    /** 각 컬럼별 피크 제한값 */
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({
        active_power: 10,
        voltage_ll: 240,
        voltage_ln: 240,
        current: 30,
        active_energy: 1.0,
        total_energy: 1000.0, // ✅ 추가: 기본 임계값
    });

    /** 커스텀 시간 범위: 시작 시각 */
    const [startAt, setStartAt] = useState<string | null>(null);

    /** 커스텀 시간 범위: 종료 시각 */
    const [endAt, setEndAt] = useState<string | null>(null);

    /** 커스텀 범위 모드 여부 */
    const isRangeMode = Boolean(startAt && endAt);

    /** 현재 줌 레벨의 설정 */
    const config = ZOOMS[zoom];

    /** ✅ 총 누적 전력량 상태 추가 */
    const [totalEnergy, setTotalEnergy] = useState<number | null>(null);

    // ------------------------------------------------------------
    // 로그 추가 함수
    // ------------------------------------------------------------

    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    // ------------------------------------------------------------
    // API 데이터 로드 함수
    // ------------------------------------------------------------

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

                const res = await fetchModbusQuery(params);
                const rows = (res?.data ?? []).map(MAP);
                setData(rows);

                if (rows.length === 0) {
                    log(`데이터 없음: ${config.label}${opts?.start ? ' (범위 모드)' : ''}`);
                } else {
                    log(
                        `로드 완료: ${rows.length}건 (${config.label}, ${res.resolution})${
                            opts?.start ? ' 범위 모드' : ''
                        }`
                    );
                }

                // ✅ 총 누적 전력량 조회
                try {
                    const totalRes = await fetchTotalEnergy(deviceId);
                    setTotalEnergy(totalRes.total_active_energy_kwh);
                    log(`총 전력량: ${totalRes.total_active_energy_kwh} kWh`);
                } catch (e) {
                    console.error('총 전력량 조회 실패:', e);
                    setTotalEnergy(null);
                }
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

    // ------------------------------------------------------------
    // 실시간 폴링 & 데이터 로드 (useEffect)
    // ------------------------------------------------------------

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
            log(`실시간 폴링 시작: ${config.intervalMs}ms마다 (${config.label})`);
        } else {
            log(`${config.label} 정적 모드 (폴링 X)`);
        }

        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log, startAt, endAt, isRangeMode]);

    // ------------------------------------------------------------
    // 통계 계산 (useMemo)
    // ------------------------------------------------------------

    const stats = useMemo(() => {
        const keys: string[] = [
            'active_power',
            'reactive_power',
            'apparent_power',
            'voltage_ll',
            'voltage_ln',
            'current',
            'power_factor',
            'active_energy',
            'total_energy', // ✅ 추가
            'reactive_energy',
            'apparent_energy',
            'peak_power',
        ];
        const s: Record<string, any> = {};
        for (const k of keys) s[k] = calcStats(data, k);
        return s as Record<string, { avg: number | null; max: number | null; min: number | null; count: number }>;
    }, [data]);

    // ------------------------------------------------------------
    // 줌 인/아웃 핸들러
    // ------------------------------------------------------------

    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    // ------------------------------------------------------------
    // 좌/우 이동 (Pan) 핸들러
    // ------------------------------------------------------------

    const panLeft = useCallback(() => {
        let sIso: string;
        let eIso: string;

        if (startAt && endAt) {
            const currentStart = new Date(startAt);
            const currentEnd = new Date(endAt);

            if (config.preset === '1day') {
                const prevDayStart = new Date(currentStart);
                prevDayStart.setDate(currentStart.getDate() - 1);
                prevDayStart.setHours(0, 0, 0, 0);

                const prevDayEnd = new Date(prevDayStart);
                prevDayEnd.setHours(23, 59, 59, 999);

                sIso = prevDayStart.toISOString();
                eIso = prevDayEnd.toISOString();
            } else if (config.preset === '1week') {
                const prevWeekStart = new Date(currentStart);
                prevWeekStart.setDate(currentStart.getDate() - 7);

                const prevWeekEnd = new Date(currentEnd);
                prevWeekEnd.setDate(currentEnd.getDate() - 7);

                sIso = prevWeekStart.toISOString();
                eIso = prevWeekEnd.toISOString();
            } else if (config.preset === '1month') {
                const prevMonthStart = new Date(currentStart);
                prevMonthStart.setMonth(currentStart.getMonth() - 1);

                const prevMonthEnd = new Date(prevMonthStart);
                prevMonthEnd.setMonth(prevMonthStart.getMonth() + 1);
                prevMonthEnd.setDate(0);
                prevMonthEnd.setHours(23, 59, 59, 999);

                sIso = prevMonthStart.toISOString();
                eIso = prevMonthEnd.toISOString();
            } else if (config.preset === '1year') {
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
    }, [config, log, startAt, endAt]);

    const panRight = useCallback(() => {
        const now = Date.now();
        let sIso: string;
        let eIso: string;

        if (startAt && endAt) {
            const currentStart = new Date(startAt);
            const currentEnd = new Date(endAt);

            if (config.preset === '1day') {
                const nextDayStart = new Date(currentStart);
                nextDayStart.setDate(currentStart.getDate() + 1);
                nextDayStart.setHours(0, 0, 0, 0);

                const nextDayEnd = new Date(nextDayStart);
                nextDayEnd.setHours(23, 59, 59, 999);

                if (nextDayStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextDayStart.toISOString();
                eIso = nextDayEnd.toISOString();
            } else if (config.preset === '1week') {
                const nextWeekStart = new Date(currentStart);
                nextWeekStart.setDate(currentStart.getDate() + 7);

                const nextWeekEnd = new Date(currentEnd);
                nextWeekEnd.setDate(currentEnd.getDate() + 7);

                if (nextWeekStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextWeekStart.toISOString();
                eIso = nextWeekEnd.toISOString();
            } else if (config.preset === '1month') {
                const nextMonthStart = new Date(currentStart);
                nextMonthStart.setMonth(currentStart.getMonth() + 1);

                const nextMonthEnd = new Date(nextMonthStart);
                nextMonthEnd.setMonth(nextMonthStart.getMonth() + 1);
                nextMonthEnd.setDate(0);
                nextMonthEnd.setHours(23, 59, 59, 999);

                if (nextMonthStart.getTime() > now) {
                    log(`미래로 이동 불가`);
                    return;
                }

                sIso = nextMonthStart.toISOString();
                eIso = nextMonthEnd.toISOString();
            } else if (config.preset === '1year') {
                const nextYearStart = new Date(currentStart);
                nextYearStart.setFullYear(currentStart.getFullYear() + 1);

                const nextYearEnd = new Date(nextYearStart);
                nextYearEnd.setMonth(11, 31);
                nextYearEnd.setHours(23, 59, 59, 999);

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
    }, [config, log, startAt, endAt]);

    // ------------------------------------------------------------
    // 상대 시간 범위 설정
    // ------------------------------------------------------------

    const setRelativeRange = (minutes: number) => {
        const end = new Date();
        const start = new Date(end.getTime() - minutes * 60 * 1000);
        setStartAt(toLocalInputString(start));
        setEndAt(toLocalInputString(end));
    };

    // ------------------------------------------------------------
    // Presenter 렌더링
    // ------------------------------------------------------------

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={DEVICE_OPTIONS}
            column={column}
            setColumn={setColumn}
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
            setPeakLimits={setPeakLimits}
            startAt={startAt}
            endAt={endAt}
            setStartAt={setStartAt}
            setEndAt={setEndAt}
            setRelativeRange={setRelativeRange}
            isRangeMode={isRangeMode}
            panLeft={panLeft}
            panRight={panRight}
            totalEnergy={totalEnergy} // ✅ 추가
        />
    );
}
