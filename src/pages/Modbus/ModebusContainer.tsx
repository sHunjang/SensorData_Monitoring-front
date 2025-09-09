// src/pages/Modbus/ModbusContainer.tsx
/** 전력 컨테이너: 장치 선택 + 프리셋 선택 + 데이터 로딩/에러 상태 관리 */
import { useEffect, useState } from 'react';
import { fetchModbusQuery } from '@/api/modbus';
import ModbusPresenter from './ModebusPresenter';

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState(11);
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1d');
    const [data, setData] = useState<any[]>([]),
        [stats, setStats] = useState<any>({}),
        [loading, setLoading] = useState(false),
        [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let on = true;
        setLoading(true);
        setError(null);
        fetchModbusQuery({ deviceId, preset, series: ['p_total', 'voltage', 'current'], maxPoints: 500 })
            .then((res) => {
                if (!on || !res) return;
                setData(res.data);
                setStats(res.stats);
            })
            .catch((e) => on && setError(e?.message ?? 'failed'))
            .finally(() => on && setLoading(false));
        return () => {
            on = false;
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
