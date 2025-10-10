/**
 * HomeContainer.tsx
 * - 목적: Presenter 에 전달할 요약 값들을 폴링해서 수집.
 * - 설계:
 *   1) Modbus: 1m preset 최근 60개 포인트에서 마지막을 현재 전력으로 사용
 *   2) Modbus: 1m preset 최근 1440개 포인트(1일)에서 에너지 차이로 당일 누적 계산
 *   3) Env/Solar: 최신 1포인트(preset=1m) 조회
 *   4) 각 호출은 실패 시 에러 상태를 설정하고 Presenter에게 전달
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
        // 1) Modbus: 최근 1분 데이터에서 마지막 포인트를 현재 전력으로 사용
        (async () => {
            try {
                setPowerError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1m', maxpoints: 60 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                // power 필드 찾기
                const powerValue = last?.power ?? null;
                setPower(safeNum(powerValue, 2));
            } catch (e) {
                setPower(null);
                setPowerError(getErrorMessage(e));
            }
        })();

        // 2) Modbus: 당일 누적 근사 (1d preset 의 최댓값 - 최솟값)
        (async () => {
            try {
                setTodayError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1m', maxpoints: 1440 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
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

        // 3) Env: 최신 1건 (preset=1m, maxpoints=1)
        (async () => {
            try {
                setEnvError(null);
                const res = await fetchEnvQuery({ deviceid: ENV_ID, preset: '1m', maxpoints: 1 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                setTemperature(safeNum(last?.temperature, 1));
                setHumidity(safeNum(last?.humidity, 1));
            } catch (e) {
                setTemperature(null);
                setHumidity(null);
                setEnvError(getErrorMessage(e));
            }
        })();

        // 4) Solar: 최신 1건 (preset=1m, maxpoints=1)
        (async () => {
            try {
                setSolarError(null);
                const res = await fetchSolarQuery({ deviceid: SOLAR_ID, preset: '1m', maxpoints: 1 });
                const rows = res?.data && Array.isArray(res.data) ? res.data : [];
                const last = rows.length ? rows[rows.length - 1] : null;

                setSolar(safeNum(last?.irradiance, 0));
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
