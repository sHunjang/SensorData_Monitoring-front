/**
 * HomeContainer.tsx
 * - HomePresenter에 필요한 데이터를 수집하고 상태 관리
 * - 전력량계(ID=11) 실시간 전력량, 당일 전력량
 * - 실시간 온도/습도, 실시간 일조량
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

    // 1. 실시간 전력량 (ID=11)
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            const r: ModbusRealtime | null = await fetchRealtime(11);
            if (!alive) return;
            setPower(r?.total_active_power_kW ?? null);
        };
        poll();
        const timer = setInterval(poll, 5000);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 2. 당일 전력량 (ID=11)
    useEffect(() => {
        let alive = true;
        const load = async () => {
            const res = await fetchModbusQuery({
                deviceId: 11,
                series: ['total_active_energy_kWh'],
                preset: '1d',
            });
            if (!alive || !res) return;
            const rows = res.data;
            if (rows.length >= 2) {
                const values = rows.map((r) => r.total_active_energy_kWh).filter((v) => v != null) as number[];
                if (values.length > 1) {
                    const delta = Math.max(...values) - Math.min(...values);
                    setTodayKwh(delta);
                }
            }
        };
        load();
        const timer = setInterval(load, 60000); // 1분마다 업데이트
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 3. 실시간 온습도
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            const res: EnvResp | null = await fetchEnvQuery({ preset: '15m', maxPoints: 1 });
            if (!alive || !res) return;
            const last = res.data.at(-1);
            if (last) {
                setTemperature(last.temperature ?? null);
                setHumidity(last.humidity ?? null);
            }
        };
        poll();
        const timer = setInterval(poll, 30000); // 30초마다
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    // 4. 실시간 일조량
    useEffect(() => {
        let alive = true;
        const poll = async () => {
            const res: SolarResp | null = await fetchSolarQuery({ preset: '15m', maxPoints: 1 });
            if (!alive || !res) return;
            const last = res.data.at(-1);
            if (last) {
                setSolar(last.solar ?? null);
            }
        };
        poll();
        const timer = setInterval(poll, 30000); // 30초마다
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    return (
        <HomePresenter power={power} todayKwh={todayKwh} temperature={temperature} humidity={humidity} solar={solar} />
    );
}
