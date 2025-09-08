/**
 * Home Container
 * - API 호출 (실시간 전력, 오늘 전력량)
 * - 상태 관리
 * - Presenter에 데이터 전달
 */
import { useEffect, useState } from 'react';
import { fetchRealtimePower } from '../../api/modbusApi';

import HomePresenter from './HomePresenter';

const fetchTodayEnergy = async (): Promise<number | null> => {
    const res = await fetch('http://localhost:8000/data/modbus/realtime');
    const data = await res.json();
    return data?.today_energy_kWh ?? null;
};

export default function HomeContainer() {
    const [realtime, setRealtime] = useState<number | null>(null);
    const [todayEnergy, setTodayEnergy] = useState<number | null>(null);

    // 실시간 전력 5초마다 갱신
    useEffect(() => {
        const tick = () => fetchRealtimePower().then(setRealtime);
        tick();
        const id = setInterval(tick, 5000);
        return () => clearInterval(id);
    }, []);

    // 오늘 전력량 1분마다 갱신
    useEffect(() => {
        const tick = () => fetchTodayEnergy().then(setTodayEnergy);
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, []);

    return (
        <HomePresenter
            realtime={realtime}
            todayEnergy={todayEnergy}
            temp={null} // 추후 Collector 연결 시 값 전달
            humidity={null}
            solar={null}
        />
    );
}
