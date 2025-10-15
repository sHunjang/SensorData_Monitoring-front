/**
 * HomeContainer.tsx
 * - 목적: 실시간 대시보드에 전달할 요약 값들을 폴링해서 수집
 * - 설계:
 *   1) Modbus (Device 11): /realtime API로 현재 전력, /today-energy API로 오늘 누적
 *   2) Env (Device 21): /realtime API로 최신 온습도
 *   3) Solar (Device 31): /realtime API로 최신 일사량
 *   4) 각 호출 실패 시 에러 상태 설정
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchRealtime as fetchModbusRealtime, fetchTodayEnergy } from '@/api/modbus';
import { fetchRealtime as fetchEnvRealtime } from '@/api/env';
import { fetchRealtime as fetchSolarRealtime } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

// ✅ 명확한 Device ID 상수
const MODBUS_DEVICE_ID = 11; // 실시간 전력 표시용
const ENV_DEVICE_ID = 21; // 온습도 표시용
const SOLAR_DEVICE_ID = 31; // 일사량 표시용

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

    // ✅ 폴링 함수: 각 Device ID에 맞춰 /realtime API 호출
    const poll = useCallback(async () => {
        console.log('🔄 [Poll] Starting poll at', new Date().toLocaleTimeString('ko-KR'));

        // 1) Modbus (Device 11): 실시간 전력
        (async () => {
            try {
                setPowerError(null);
                console.log('🔍 [Modbus] Fetching realtime...');
                const res = await fetchModbusRealtime(MODBUS_DEVICE_ID);
                console.log('✅ [Modbus] Response:', res);
                console.log('✅ [Modbus] Power value:', res.power);
                setPower(safeNum(res.power, 2));
            } catch (e) {
                console.error('❌ [Modbus] Error:', e);
                setPower(null);
                setPowerError(getErrorMessage(e));
            }
        })();

        // 2) Modbus (Device 11): 오늘 누적 에너지
        (async () => {
            try {
                setTodayError(null);
                const res = await fetchTodayEnergy(MODBUS_DEVICE_ID);
                console.log('✅ [Today Energy] Response:', res);
                setTodayKwh(safeNum(res.energy_kwh, 2));
            } catch (e) {
                console.error('❌ [Today Energy] Error:', e);
                setTodayKwh(null);
                setTodayError(getErrorMessage(e));
            }
        })();

        // 3) Env (Device 21): 실시간 온습도
        (async () => {
            try {
                setEnvError(null);
                const res = await fetchEnvRealtime(ENV_DEVICE_ID);
                console.log('✅ [Env] Response:', res);
                setTemperature(safeNum(res.temperature, 1));
                setHumidity(safeNum(res.humidity, 1));
            } catch (e) {
                console.error('❌ [Env] Error:', e);
                setTemperature(null);
                setHumidity(null);
                setEnvError(getErrorMessage(e));
            }
        })();

        // 4) Solar (Device 31): 실시간 일사량
        (async () => {
            try {
                setSolarError(null);
                const res = await fetchSolarRealtime(SOLAR_DEVICE_ID);
                console.log('✅ [Solar] Response:', res);
                setSolar(safeNum(res.irradiance, 0));
            } catch (e) {
                console.error('❌ [Solar] Error:', e);
                setSolar(null);
                setSolarError(getErrorMessage(e));
            }
        })();
    }, []);

    // 컴포넌트 마운트 시 즉시 호출하고 5초 단위로 폴링
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        poll();

        // 5초마다 폴링 (백엔드 수집 주기와 동일)
        const id = setInterval(() => {
            if (!mountedRef.current) return;
            poll();
        }, 5000);

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
