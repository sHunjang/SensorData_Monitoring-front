/**
 * ModbusContainer.tsx
 * - 전력량계 페이지 상태 관리 및 API 호출
 * - 에러 메시지를 상세하게 표시하도록 개선
 */
import { useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery, ModbusQueryResp } from '@/api/modbus';

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState<number>(11);
    const [column, setColumn] = useState<string>('total_active_energy_kWh');
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1h');
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuery = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: ModbusQueryResp | null = await fetchModbusQuery({
                deviceId,
                series: [column],
                preset,
                maxPoints: 500,
            });
            if (res) {
                setData(res.data);
                setStats(res.stats);
            }
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handleShift = async (dir: 'left' | 'right') => {
        alert(`Shift ${dir} (추후 start/end 기반 구현)`);
    };

    const handleZoom = (dir: 'in' | 'out') => {
        const order: Array<'15m' | '1h' | '1d' | '1w' | '1mo'> = ['15m', '1h', '1d', '1w', '1mo'];
        const idx = order.indexOf(preset);
        if (dir === 'in' && idx > 0) setPreset(order[idx - 1]);
        if (dir === 'out' && idx < order.length - 1) setPreset(order[idx + 1]);
    };

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            column={column}
            setColumn={setColumn}
            preset={preset}
            setPreset={setPreset}
            onQuery={handleQuery}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
        />
    );
}
