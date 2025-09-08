/**
 * Container
 * - API 호출, 상태 관리, 폴링 타이머
 * - Presenter에 데이터 전달
 */
import { useEffect, useState } from 'react';
import { fetchModbusData, fetchRealtimePower, ModbusPoint } from '../../api/modbusApi';
import ModbusPresenter from './ModbusPresenter';

export default function ModbusContainer() {
    const [data, setData] = useState<ModbusPoint[]>([]);
    const [realtime, setRealtime] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // 초기 집계 데이터 조회
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetchModbusData('1h');
                if (mounted) setData(res);
            } catch (e: any) {
                setErr(e?.message ?? '데이터 조회 실패');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // 실시간 전력 5초 폴링
    useEffect(() => {
        let cancel = false;
        async function tick() {
            try {
                const v = await fetchRealtimePower();
                if (!cancel) setRealtime(v);
            } catch {
                /* 무시하고 다음 주기 */
            }
        }
        tick();
        const id = setInterval(tick, 5000);
        return () => {
            cancel = true;
            clearInterval(id);
        };
    }, []);

    return <ModbusPresenter data={data} realtime={realtime} loading={loading} error={err} />;
}
