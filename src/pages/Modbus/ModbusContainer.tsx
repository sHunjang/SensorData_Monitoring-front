import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
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
        preset: Preset; // API 프리셋 (백엔드로 전송)
        label: string; // UI 표시 레이블
        realtime: boolean; // 실시간 폴링 여부
        maxPoints: number; // 최대 데이터 포인트 수
        intervalMs: number; // 폴링 간격 (ms)
    }
> = {
    0: { preset: '1day', label: '1일', realtime: true, maxPoints: 1440, intervalMs: 60000 }, // 1분마다 갱신
    1: { preset: '1week', label: '1주', realtime: true, maxPoints: 672, intervalMs: 900000 }, // 15분마다 갱신
    2: { preset: '1month', label: '1개월', realtime: false, maxPoints: 720, intervalMs: 3600000 }, // 수동 갱신
    3: { preset: '1year', label: '1년', realtime: false, maxPoints: 365, intervalMs: 86400000 }, // 수동 갱신
};

/** 조회 가능한 디바이스 ID 목록 (전력량계 11~15번) */
const DEVICE_OPTIONS = [11, 12, 13, 14, 15];

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * API 응답 데이터를 프론트엔드 형식으로 변환
 * @param row - API 응답 row 객체
 * @returns 변환된 데이터 객체
 */
const MAP = (row: any) => {
    console.log('[MAP] Input row:', row); // 디버깅용

    const mapped = {
        bucket: row.bucket, // 시간 버킷 (timestamp)
        active_power: row.power ?? null, // 유효 전력 (kW)
        voltage_ll: row.voltage ?? null, // 선간 전압 (V)
        voltage_ln: row.voltage ?? null, // 상전압 (V)
        current: row.current ?? null, // 전류 (A)
        active_energy: row.energy_delta ?? null, // 소비 전력량 (kWh)
        peak_power: row.peak_power ?? null, // 피크 전력 (15분 이상 해상도)
        reactive_power: row.reactive_power ?? null, // 무효 전력
        apparent_power: row.apparent_power ?? null, // 피상 전력
        power_factor: row.power_factor ?? null, // 역률
        reactive_energy: row.reactive_energy ?? null, // 무효 전력량
        apparent_energy: row.apparent_energy ?? null, // 피상 전력량
    };

    console.log('[MAP] Mapped row:', mapped); // 디버깅용
    return mapped;
};

/**
 * 데이터 배열에서 지정된 키의 통계 계산
 * @param rows - 데이터 배열
 * @param key - 통계 계산할 키 (예: 'active_power')
 * @returns {avg, max, min, count} 통계 객체
 */
function calcStats(rows: any[], key: string) {
    // 유효한 숫자만 필터링
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
 * @param value - datetime-local 문자열 (예: "2025-10-15T17:25")
 * @returns ISO 8601 형식 문자열 또는 undefined
 */
function toIsoLocal(value?: string | null) {
    if (!value) return undefined;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

/**
 * Date 객체를 datetime-local input 형식으로 변환
 * @param d - Date 객체
 * @returns "YYYY-MM-DDTHH:mm" 형식 문자열
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

    /** 현재 선택된 그래프 컬럼 (유효 전력이 기본값) */
    const [column, setColumn] = useState<
        | 'active_power'
        | 'reactive_power'
        | 'apparent_power'
        | 'voltage_ll'
        | 'voltage_ln'
        | 'current'
        | 'power_factor'
        | 'active_energy'
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

    /** 각 컬럼별 피크 제한값 (그래프 경고선 표시용) */
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({
        active_power: 10,
        voltage_ll: 240,
        voltage_ln: 240,
        current: 30,
        active_energy: 1.0,
    });

    /** 커스텀 시간 범위: 시작 시각 (datetime-local 형식) */
    const [startAt, setStartAt] = useState<string | null>(null);

    /** 커스텀 시간 범위: 종료 시각 (datetime-local 형식) */
    const [endAt, setEndAt] = useState<string | null>(null);

    /** 커스텀 범위 모드 여부 (시작/종료 시각이 모두 설정되면 true) */
    const isRangeMode = Boolean(startAt && endAt);

    /** 현재 줌 레벨의 설정 */
    const config = ZOOMS[zoom];

    // ------------------------------------------------------------
    // 로그 추가 함수
    // ------------------------------------------------------------

    /**
     * 디버깅 로그 추가 (최대 200개 유지)
     * @param msg - 로그 메시지
     */
    const log = useCallback((msg: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${msg}`].slice(-200));
    }, []);

    // ------------------------------------------------------------
    // API 데이터 로드 함수
    // ------------------------------------------------------------

    /**
     * API로부터 데이터 로드
     * @param opts - {start, end} 커스텀 시간 범위 (선택사항)
     */
    const load = useCallback(
        async (opts?: { start?: string; end?: string }) => {
            setLoading(true);
            setError(null);

            try {
                // API 요청 파라미터 구성
                const params: any = {
                    deviceid: deviceId,
                    preset: config.preset,
                    maxpoints: config.maxPoints,
                };

                // 커스텀 범위가 있으면 추가
                if (opts?.start) params.start = opts.start;
                if (opts?.end) params.end = opts.end;

                // API 호출
                const res = await fetchModbusQuery(params);

                // 데이터 변환
                const rows = (res?.data ?? []).map(MAP);
                setData(rows);

                // 로그 기록
                if (rows.length === 0) {
                    log(`데이터 없음: ${config.label}${opts?.start ? ' (범위 모드)' : ''}`);
                } else {
                    log(
                        `로드 완료: ${rows.length}건 (${config.label}, ${res.resolution})${
                            opts?.start ? ' 범위 모드' : ''
                        }`
                    );
                }
            } catch (e) {
                const m = getErrorMessage(e);
                setError(m);
                setData([]); // 그래프 공백 유지
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

        // 기존 타이머 정리
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = undefined;
        }

        // 커스텀 범위 모드: 1회만 로드 (폴링 X)
        if (isRangeMode) {
            load({ start: sIso!, end: eIso! });
            log(`범위 모드: ${sIso} ~ ${eIso}`);
            return;
        }

        // 일반 모드: 최초 로드
        load();

        // 실시간 폴링 설정 (realtime: true인 경우만)
        if (config.realtime) {
            timerRef.current = window.setInterval(() => load(), config.intervalMs) as unknown as number;
            log(`실시간 폴링 시작: ${config.intervalMs}ms마다 (${config.label})`);
        } else {
            log(`${config.label} 정적 모드 (폴링 X)`);
        }

        // cleanup: 타이머 정리
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [load, config, log, startAt, endAt, isRangeMode]);

    // ------------------------------------------------------------
    // 통계 계산 (useMemo)
    // ------------------------------------------------------------

    /**
     * 데이터 배열로부터 각 컬럼별 통계 계산
     */
    const stats = useMemo(() => {
        const keys: string[] = ['active_power', 'voltage_ll', 'voltage_ln', 'current', 'active_energy', 'peak_power'];
        const s: Record<string, any> = {};
        for (const k of keys) s[k] = calcStats(data, k);
        return s as Record<string, { avg: number | null; max: number | null; min: number | null; count: number }>;
    }, [data]);

    // ------------------------------------------------------------
    // 줌 인/아웃 핸들러
    // ------------------------------------------------------------

    /** 줌 인 (1년 → 1개월 → 1주 → 1일) */
    const onZoomIn = () => setZoom((z) => (z > 0 ? ((z - 1) as ZoomLevel) : z));

    /** 줌 아웃 (1일 → 1주 → 1개월 → 1년) */
    const onZoomOut = () => setZoom((z) => (z < 3 ? ((z + 1) as ZoomLevel) : z));

    // ------------------------------------------------------------
    // 좌/우 이동 (Pan) 핸들러
    // ✅ 수정: 현재 줌 레벨에 맞춰 이동 (1일/1주/1개월/1년)
    // ------------------------------------------------------------

    /**
     * 좌 버튼 클릭: 현재 preset 단위로 왼쪽 이동
     * - 1일 모드: 어제
     * - 1주 모드: 지난주 (월~일)
     * - 1개월 모드: 지난달 (1일~말일)
     * - 1년 모드: 작년 (1월~12월)
     */
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

    /**
     * 우 버튼 클릭: 현재 preset 단위로 오른쪽 이동
     * ✅ 미래로는 이동 불가 (오늘까지만)
     */
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

    // ------------------------------------------------------------
    // 상대 시간 범위 설정 (예: 최근 30분)
    // ------------------------------------------------------------

    /**
     * 상대 시간 범위 설정 (예: 최근 30분)
     * @param minutes - 현재 시각으로부터 몇 분 전까지
     */
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
                // 데이터 포인트 클릭 시 줌 인
                if (zoom === 3) setZoom(2);
                else if (zoom === 2) setZoom(1);
                else if (zoom === 1) setZoom(0);
            }}
            onManualRefresh={() => {
                // 수동 새로고침
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
        />
    );
}
