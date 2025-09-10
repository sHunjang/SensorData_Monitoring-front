/**
 * 전력 페이지 컨테이너 (풀네임 컬럼 적용)
 * - 장치 ID 선택
 * - 기간 프리셋 선택
 * - 주요 시리즈 조회 및 상태 관리
 */
import { useEffect, useState } from 'react';
import { fetchModbusQuery } from '@/api/modbus';

import ModbusPresenter from './ModebusPresenter';

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState(11);
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1d');
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        fetchModbusQuery({
            deviceId,
            // ✅ 풀네임 컬럼 기반 시리즈
            series: ['total_active_energy_kwh'],
            preset,
            maxPoints: 500,
        })
            .then((res) => {
                if (!alive || !res) return;
                setData(res.data);
                setStats(res.stats);
            })
            .catch((e) => alive && setError(e?.message ?? 'failed'))
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [deviceId, preset]);

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            preset={preset}
            setPreset={setPreset}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
        />
    );
}
