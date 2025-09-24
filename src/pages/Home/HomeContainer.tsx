// src/pages/Home/HomeContainer.tsx
/**
 *
 * 목적:
 * - 실시간 전력, 당일 누적(kWh), 온습도 최신, 일사량 최신을 폴링해서 Presenter에 전달.
 * - API 응답 스키마가 불안정할 때 발생하던 오류를 방지하기 위해
 *   1) 원시 응답(raw)을 보존하고
 *   2) 값 추출을 방어적으로 수행함.
 *
 * 변경/보완 사항:
 * - fetchModbusRealtime 응답이 다양한 필드를 가질 수 있어 metrics?.p_kw 접근에서 에러가 났음.
 *   -> rawModbus 상태에 전체 응답을 보관하고, 숫자 추출은 extractFromRealtime()로 안전 처리.
 * - env/solar 쿼리는 normalizeRows()로 표준화한 후 마지막 행을 raw로 보관.
 * - 각 값 추출은 여러 후보 키를 검사(예: p_kw, power, total_active_power_kw 등).
 * - 폴링 루프는 alive 플래그로 안전하게 정리.
 *
 * 사용법:
 * - HomePresenter는 기존 props 인터페이스(숫자/nullable) 그대로 받음.
 * - 만약 Presenter에서 SummaryText에 raw 객체를 직접 넘기려면 Presenter 쪽도 수정 가능(현재는 숫자 전달).
 */

import { useEffect, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchRealtime as fetchModbusRealtime, fetchTodayEnergy } from '@/api/modbus';
import { fetchEnvQuery } from '@/api/env';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

/** 유틸: realtime 응답에서 숫자 추출 (여러 후보 키를 시도) */
function extractFromRealtime(raw: any, candidates: string[]) {
    if (raw == null) return null;
    // 1) metrics 객체 우선
    const metrics = raw.metrics ?? raw.metrics ?? (raw as any).metric ?? null;
    if (metrics && typeof metrics === 'object') {
        for (const k of candidates) {
            if (k in metrics) {
                const v = metrics[k];
                const n = Number(v);
                if (!Number.isNaN(n)) return n;
            }
        }
    }
    // 2) 최상위 필드에서 후보 순회
    for (const k of candidates) {
        if (k in raw) {
            const v = raw[k];
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
        }
    }
    // 3) 문자열 형태의 timestamp-only 응답 등 방어: raw.p_kw-like keys
    const keys = Object.keys(raw);
    for (const key of keys) {
        const v = raw[key];
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
    }
    return null;
}

/** 후보 키셋: 전력(kW), 에너지(kWh) 각각 */
const POWER_CANDIDATES = ['p_kw', 'power', 'total_active_power_kw', 'total_active_kw'];
const ENERGY_CANDIDATES = ['e_kwh', 'energy', 'total_active_energy_kwh'];

export default function HomeContainer() {
    // 숫자 상태 (Presenter에 전달할 최종 값)
    const [power, setPower] = useState<number | null>(null);
    const [todayKwh, setTodayKwh] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [humidity, setHumidity] = useState<number | null>(null);
    const [solar, setSolar] = useState<number | null>(null);

    // 원시 응답(디버그/추가 처리용)
    const [rawModbus, setRawModbus] = useState<any | null>(null);
    const [rawEnvLast, setRawEnvLast] = useState<any | null>(null);
    const [rawSolarLast, setRawSolarLast] = useState<any | null>(null);

    // 에러 상태
    const [powerError, setPowerError] = useState<string | null>(null);
    const [todayError, setTodayError] = useState<string | null>(null);
    const [envError, setEnvError] = useState<string | null>(null);
    const [solarError, setSolarError] = useState<string | null>(null);

    // // --------------------------
    // // 실시간 전력 (5초 폴링)
    // // --------------------------
    // useEffect(() => {
    //     let alive = true;
    //     const poll = async () => {
    //         try {
    //             const r = await fetchModbusRealtime(11);
    //             if (!alive) return;
    //             setRawModbus(r ?? null);
    //             // 방어적 추출: metrics 내부 또는 최상위에서 후보 키 순회
    //             const p = extractFromRealtime(r, POWER_CANDIDATES);
    //             setPower(p === null ? null : Number(p));
    //             setPowerError(null);
    //         } catch (e) {
    //             if (!alive) return;
    //             setPower(null);
    //             setRawModbus(null);
    //             setPowerError(getErrorMessage(e));
    //         }
    //     };
    //     poll();
    //     const id = setInterval(poll, 1000);
    //     return () => {
    //         alive = false;
    //         clearInterval(id);
    //     };
    // }, []);

    // // --------------------------
    // // 당일 전력량 (60초 폴링)
    // // --------------------------
    // useEffect(() => {
    //     let alive = true;
    //     const load = async () => {
    //         try {
    //             const r = await fetchTodayEnergy(11);
    //             if (!alive) return;
    //             const kwh = r?.kwh ?? null;
    //             setTodayKwh(kwh == null ? null : Number(kwh));
    //             setTodayError(null);
    //         } catch (e) {
    //             if (!alive) return;
    //             setTodayKwh(null);
    //             setTodayError(getErrorMessage(e));
    //         }
    //     };
    //     load();
    //     const id = setInterval(load, 1000);
    //     return () => {
    //         alive = false;
    //         clearInterval(id);
    //     };
    // }, []);

    // --------------------------
    // 온/습도 최신 1건 (30초 폴링)
    // --------------------------
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                // preset=15m, max_points=1 으로 최신 1건 조회
                const res = await fetchEnvQuery({ preset: '15m', max_points: 1, device_id: undefined });
                if (!alive) return;
                const rows = normalizeRows(res?.data ?? []);
                const last = rows?.length ? rows[rows.length - 1] : null;
                setRawEnvLast(last ?? null);

                // 방어적 필드명 처리: temperature / temperature_c 등
                const temp = last?.temperature ?? last?.temperature_c ?? null;
                const hum = last?.humidity ?? last?.humidity_rh ?? null;
                setTemperature(temp == null ? null : Number(temp));
                setHumidity(hum == null ? null : Number(hum));
                setEnvError(null);
            } catch (e) {
                if (!alive) return;
                setTemperature(null);
                setHumidity(null);
                setRawEnvLast(null);
                setEnvError(getErrorMessage(e));
            }
        };
        poll();
        const id = setInterval(poll, 1000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // --------------------------
    // 일사량 최신 1건 (30초 폴링)
    // --------------------------
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                // device_id=1 명시 추가
                const res = await fetchSolarQuery({ preset: '15m', max_points: 1, device_id: undefined });
                if (!alive) return;
                const rows = normalizeRows(res.data);
                const last = rows.at(-1);
                setSolar(last?.solar ?? last?.solar_irradiance_wm2 ?? null);
                setSolarError(null);
            } catch (e) {
                setSolar(null);
                setSolarError(getErrorMessage(e));
            }
        };
        poll();
        const id = setInterval(poll, 1000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // Presenter에 숫자형 값과 에러 메시지를 전달.
    // (원한다면 raw 응답 객체(rawModbus/rawEnvLast/rawSolarLast)를 Presenter로 넘겨서
    //  Presenter가 SummaryText에 직접 전달하게 할 수도 있음.)
    return (
        <HomePresenter
            power={power}
            todayKwh={todayKwh}
            temperature={temperature}
            humidity={humidity}
            solar={solar}
            powerError={powerError}
            todayError={todayError}
            envError={envError}
            solarError={solarError}
        />
    );
}
