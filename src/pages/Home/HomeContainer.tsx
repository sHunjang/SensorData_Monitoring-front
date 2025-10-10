/**
 * HomeContainer.tsx
 * - 목적: Presenter 에 전달할 요약 값들을 폴링해서 수집.
 * - Backend 응답 형식에 맞춤 (bucket, power, energy, temperature, humidity, irradiance)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { fetchEnvQuery } from '@/api/env';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

const MODBUS_ID = 11;
const ENV_ID = 21;
const SOLAR_ID = 31;

// 안전한 숫자 추출 유틸
function safeNum(v: any, digits?: number) {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return typeof digits === 'number' ? Number(n.toFixed(digits)) : n;
}

export default function HomeContainer() {
    // 표시값
    const [power, setPower] = useState<number | null>(null);
    const [todayKwh, setTodayKwh] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [humidity, setHumidity] = useState<number | null>(null);
    const [solar, setSolar] = useState<number | null>(null);

    // 에러 상태 (각 카드별)
    const [powerError, setPowerError] = useState<string | null>(null);
    const [todayError, setTodayError] = useState<string | null>(null);
    const [envError, setEnvError] = useState<string | null>(null);
    const [solarError, setSolarError] = useState<string | null>(null);

    // 폴링 함수 (한 번에 모든 항목 조회)
    const poll = useCallback(async () => {
        // 1) Modbus: 최근 1시간 데이터에서 마지막 포인트를 현재 전력으로 사용
        (async () => {
            try {
                setPowerError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1m', maxpoints: 60 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                // ✅ Backend 필드명: power
                const v = last?.power ?? null;
                setPower(safeNum(v, 2));
            } catch (e) {
                setPower(null);
                setPowerError(getErrorMessage(e));
            }
        })();

        // 2) Modbus: 당일 누적 근사 (최댓값 - 최솟값)
        (async () => {
            try {
                setTodayError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1m', maxpoints: 1440 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];

                // ✅ Backend 필드명: energy
                const nums = rows
                    .map((r: any) => r?.energy ?? null)
                    .map((x: any) => Number(x))
                    .filter((n: number) => Number.isFinite(n));

                const kwh = nums.length ? Number((Math.max(...nums) - Math.min(...nums)).toFixed(2)) : null;
                setTodayKwh(kwh);
            } catch (e) {
                setTodayKwh(null);
                setTodayError(getErrorMessage(e));
            }
        })();

        // 3) Env: 최신 1건
        (async () => {
            try {
                setEnvError(null);
                const res = await fetchEnvQuery({ deviceid: ENV_ID, preset: '1m', maxpoints: 1 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                // ✅ Backend 필드명: temperature, humidity
                const t = last?.temperature ?? null;
                const h = last?.humidity ?? null;

                setTemperature(safeNum(t, 1));
                setHumidity(safeNum(h, 1));
            } catch (e) {
                setTemperature(null);
                setHumidity(null);
                setEnvError(getErrorMessage(e));
            }
        })();

        // 4) Solar: 최신 1건
        (async () => {
            try {
                setSolarError(null);
                const res = await fetchSolarQuery({ deviceid: SOLAR_ID, preset: '1m', maxpoints: 1 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                // ✅ Backend 필드명: irradiance
                const s = last?.irradiance ?? null;
                setSolar(safeNum(s, 0));
            } catch (e) {
                setSolar(null);
                setSolarError(getErrorMessage(e));
            }
        })();
    }, []);

    // 컴포넌트 마운트 시 즉시 호출하고 30초 단위로 폴링
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        poll();
        const id = setInterval(() => {
            if (!mountedRef.current) return;
            poll();
        }, 30000);
        return () => {
            mountedRef.current = false;
            clearInterval(id);
        };
    }, [poll]);

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
