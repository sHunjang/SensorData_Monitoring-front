// src/pages/Home/HomeContainer.tsx
// - 홈 요약 카드 폴링(30초): Modbus(1h/1d), Env(1h, 1포인트), Solar(1h, 1포인트)
// - 전부 /data/*/query + deviceid/maxpoints + 표준 preset으로 통일

import React, { useCallback, useEffect, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { fetchEnvQuery } from '@/api/env';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';

const MODBUS_ID = 11;
const ENV_ID = 21;
const SOLAR_ID = 31;

export default function HomeContainer() {
    // 표시 값
    const [powerKw, setPowerKw] = useState<number | null>(null);
    const [todayKwh, setTodayKwh] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [humidity, setHumidity] = useState<number | null>(null);
    const [solar, setSolar] = useState<number | null>(null);

    // 에러 분리
    const [powerError, setPowerError] = useState<string | null>(null);
    const [todayError, setTodayError] = useState<string | null>(null);
    const [envError, setEnvError] = useState<string | null>(null);
    const [solarError, setSolarError] = useState<string | null>(null);

    const poll = useCallback(async () => {
        // 1) Modbus 전력(1h 마지막 포인트)
        (async () => {
            try {
                setPowerError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1h', maxpoints: 60 });
                const rows = res?.data ?? [];
                const last = rows.length ? rows[rows.length - 1] : null;
                const v = last?.totalactivepowerkw;
                setPowerKw(typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(2)) : null);
            } catch (e) {
                setPowerError(getErrorMessage(e));
                setPowerKw(null);
            }
        })();

        // 2) Modbus 금일 에너지(1d 누적 근사)
        (async () => {
            try {
                setTodayError(null);
                const res = await fetchModbusQuery({ deviceid: MODBUS_ID, preset: '1d', maxpoints: 1440 });
                const rows = res?.data ?? [];
                const nums = rows
                    .map((r) => r?.totalactiveenergykwh)
                    .filter((x: any) => typeof x === 'number' && Number.isFinite(x)) as number[];
                const kwh = nums.length ? Number((Math.max(...nums) - Math.min(...nums)).toFixed(2)) : null;
                setTodayKwh(kwh);
            } catch (e) {
                setTodayError(getErrorMessage(e));
                setTodayKwh(null);
            }
        })();

        // 3) 환경(1h 1포인트)
        (async () => {
            try {
                setEnvError(null);
                const res = await fetchEnvQuery({ deviceid: ENV_ID, preset: '1h', maxpoints: 1 });
                const rows = res?.data ?? [];
                const last = rows.length ? rows[rows.length - 1] : null;
                const t = last?.temperature;
                const h = last?.humidity;
                setTemperature(typeof t === 'number' && Number.isFinite(t) ? Number(t.toFixed(1)) : null);
                setHumidity(typeof h === 'number' && Number.isFinite(h) ? Number(h.toFixed(1)) : null);
            } catch (e) {
                setEnvError(getErrorMessage(e));
                setTemperature(null);
                setHumidity(null);
            }
        })();

        // 4) 태양광(1h 1포인트)
        (async () => {
            try {
                setSolarError(null);
                const res = await fetchSolarQuery({ deviceid: SOLAR_ID, preset: '1h', maxpoints: 1 });
                const rows = res?.data ?? [];
                const last = rows.length ? rows[rows.length - 1] : null;
                const s = last?.irradiance;
                setSolar(typeof s === 'number' && Number.isFinite(s) ? Number(s.toFixed(2)) : null);
            } catch (e) {
                setSolarError(getErrorMessage(e));
                setSolar(null);
            }
        })();
    }, []);

    useEffect(() => {
        poll();
        const t = setInterval(poll, 30000);
        return () => clearInterval(t);
    }, [poll]);

    return (
        <HomePresenter
            power={powerKw}
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
