/**
 * HomeContainer.tsx
 * - 홈 대시보드 상태 관리
 * - 실시간 전력, 당일 전력량, 실시간 온습도, 실시간 일사량
 * - 에러 발생 시 Error 컴포넌트로 표시
 */
import { useEffect, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchRealtime, fetchModbusQuery, ModbusRealtime } from '@/api/modbus';
import { fetchEnvQuery, EnvResp } from '@/api/env';
import { fetchSolarQuery, SolarResp } from '@/api/solar';

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

    // 실시간 전력
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const r: ModbusRealtime | null = await fetchRealtime(11);
                if (!alive) return;
                setPower(r?.power ?? null);
                setPowerError(null);
            } catch (e: any) {
                setPowerError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
            }
        };
        poll();
        const timer = setInterval(poll, 5000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 당일 전력량
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const res = await fetchModbusQuery({
                    deviceId: 11,
                    series: ['energy'],
                    preset: '1d',
                });
                if (!alive || !res) return;
                const values = res.data.map((r) => r.energy).filter((v) => v != null) as number[];
                if (values.length >= 2) {
                    const delta = values[values.length - 1] - values[0];
                    setTodayKwh(delta >= 0 ? delta : null);
                } else {
                    setTodayKwh(null);
                }
                setTodayError(null);
            } catch (e: any) {
                setTodayError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
            }
        };
        load();
        const timer = setInterval(load, 60000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 실시간 온습도
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res: EnvResp | null = await fetchEnvQuery({ preset: '15m', maxPoints: 1 });
                if (!alive || !res) return;
                const last = res.data.at(-1);
                if (last) {
                    setTemperature(last.temperature ?? null);
                    setHumidity(last.humidity ?? null);
                }
                setEnvError(null);
            } catch (e: any) {
                setEnvError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
            }
        };
        poll();
        const timer = setInterval(poll, 30000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 실시간 일사량
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            try {
                const res: SolarResp | null = await fetchSolarQuery({ preset: '15m', maxPoints: 1 });
                if (!alive || !res) return;
                const last = res.data.at(-1);
                if (last) {
                    setSolar(last.solar ?? null);
                }
                setSolarError(null);
            } catch (e: any) {
                setSolarError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
            }
        };
        poll();
        const timer = setInterval(poll, 30000);
        return () => {
            alive = false;
            clearInterval(timer);
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
