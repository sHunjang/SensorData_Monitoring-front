// src/pages/Home/HomeContainer.tsx
/**
 * HomeContainer
 * - 실시간 전력, 당일 누적(kWh), 온습도 최신, 일사량 최신을 폴링
 * - 각 응답에 대해 널 안전하게 값을 추출하여 Presenter로 전달
 * - 폴링 주기와 예외 처리는 이 컴포넌트 책임
 */
import { useEffect, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchRealtime as fetchModbusRealtime, fetchTodayEnergy } from '@/api/modbus';
import { fetchEnvQuery } from '@/api/env';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

export default function HomeContainer() {
    const [power, setPower] = useState<number | null>(null);
    const [todayKwh, setTodayKwh] = useState<number | null>(null);
    const [temperature, setTemperature] = useState<number | null>(null);
    const [humidity, setHumidity] = useState<number | null>(null);
    const [solar, setSolar] = useState<number | null>(null);

    const [powerError, setPowerError] = useState<string | null>(null);
    const [todayError, setTodayError] = useState<string | null>(null);
    const [envError, setEnvError] = useState<string | null>(null);
    const [solarError, setSolarError] = useState<string | null>(null);

    // 실시간 전력 (5초 폴링)
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const r = await fetchModbusRealtime(11);
                if (!alive) return;
                setPower(r?.metrics?.p_kw ?? null);
                setPowerError(null);
            } catch (e) {
                setPower(null);
                setPowerError(getErrorMessage(e));
            }
        };
        poll();
        const id = setInterval(poll, 5000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // 당일 전력량 (60초 폴링)
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const r = await fetchTodayEnergy(11);
                if (!alive) return;
                setTodayKwh(r?.kwh ?? null);
                setTodayError(null);
            } catch (e) {
                setTodayKwh(null);
                setTodayError(getErrorMessage(e));
            }
        };
        load();
        const id = setInterval(load, 60_000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // 온/습도 최신 1건 (30초 폴링)
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res = await fetchEnvQuery({ preset: '15m', max_points: 1 });
                if (!alive) return;
                const rows = normalizeRows(res.data);
                const last = rows.at(-1);
                setTemperature(last?.temperature ?? last?.temperature_c ?? null);
                setHumidity(last?.humidity ?? last?.humidity_rh ?? null);
                setEnvError(null);
            } catch (e) {
                setTemperature(null);
                setHumidity(null);
                setEnvError(getErrorMessage(e));
            }
        };
        poll();
        const id = setInterval(poll, 30_000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

    // 일사량 최신 1건 (30초 폴링)
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res = await fetchSolarQuery({ preset: '15m', max_points: 1 });
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
        const id = setInterval(poll, 30_000);
        return () => {
            alive = false;
            clearInterval(id);
        };
    }, []);

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
