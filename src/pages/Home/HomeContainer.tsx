/**
 * 홈 대시보드 컨테이너 (풀네임 컬럼 적용)
 * - 실시간 총 유효전력(total_active_power_kW, device_id=11)
 * - 당일 총 전력량(total_active_energy_kWh 증가분)
 * - 온도/습도 최근값
 * - 일사량 최근값
 */
import { useCallback, useState } from 'react';
import HomePresenter from './HomePresenter';
import { fetchRealtime, fetchEnergyToday } from '@/api/modbus';
import { fetchEnvLatest } from '@/api/env';
import { fetchSolarLatest } from '@/api/solar';
import { usePolling } from '@/hooks/usePolling';

const DEVICE_ID = 11; // 현재 연결된 전력량계

export default function HomeContainer() {
    // 실시간 유효전력 (kW)
    const [kw, setKw] = useState<number | null>(null);
    const pollRealtime = useCallback(async () => {
        const r = await fetchRealtime(DEVICE_ID);
        setKw(r?.total_active_power_kW ?? null); // DB 컬럼명 변경 반영
    }, []);
    usePolling(pollRealtime, 5000);

    // 당일 전력량 (kWh)
    const [kwh, setKwh] = useState<number | null>(null);
    const pollEnergy = useCallback(async () => {
        const r = await fetchEnergyToday(DEVICE_ID);
        setKwh(r?.kwh ?? null);
    }, []);
    usePolling(pollEnergy, 60000);

    // 온도 / 습도
    const [temperature, setTemperature] = useState<number | null>(null);
    const [humidity, setHumidity] = useState<number | null>(null);
    const pollEnv = useCallback(async () => {
        const r = await fetchEnvLatest();
        setTemperature(r?.temperature ?? null);
        setHumidity(r?.humidity ?? null);
    }, []);
    usePolling(pollEnv, 60000);

    // 일사량
    const [solar, setSolar] = useState<number | null>(null);
    const pollSolar = useCallback(async () => {
        const r = await fetchSolarLatest();
        setSolar(r?.solar ?? null);
    }, []);
    usePolling(pollSolar, 60000);

    return <HomePresenter kw={kw} kwh={kwh} temperature={temperature} humidity={humidity} solar={solar} />;
}
