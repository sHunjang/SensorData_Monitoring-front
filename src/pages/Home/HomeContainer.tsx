// src/pages/Home/HomeContainer.tsx
/** 홈 컨테이너: 실시간 유효전력 카드(장치 11 기본) */
import { useState, useCallback } from 'react';

import HomePresenter from './HomePresenter';
import { fetchRealtime } from '@/api/modbus';
import { usePolling } from '@/hooks/usePolling';

export default function HomeContainer() {
    const [kw, setKw] = useState<number | null>(null);
    const poll = useCallback(async () => {
        const r = await fetchRealtime(11);
        setKw(r?.total_active_power_kW ?? null);
    }, []);
    usePolling(poll, 5000);
    return <HomePresenter kw={kw} />;
}
