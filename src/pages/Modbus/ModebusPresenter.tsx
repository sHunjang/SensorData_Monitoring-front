// src/pages/Modbus/ModbusPresenter.tsx
/** 전력 프레젠터: 컨트롤 + 차트 + 통계. 반응형 카드. */
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatsPanel from '@/components/metrics/StatsPanel';
import { SERIES_LABELS } from '@/constants/labels';

export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    preset,
    setPreset,
    data,
    stats,
    loading,
    error,
}: {
    deviceId: number;
    setDeviceId: (n: number) => void;
    preset: '15m' | '1h' | '1d' | '1w' | '1mo';
    setPreset: (p: any) => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
}) {
    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <label>
                    Device
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(parseInt(e.target.value, 10))}
                        className={styles.input}
                    >
                        {[11, 12, 13, 14, 15].map((id) => (
                            <option key={id} value={id}>
                                {id}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Interval
                    <select value={preset} onChange={(e) => setPreset(e.target.value)} className={styles.input}>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="1d">1d</option>
                        <option value="1w">1w</option>
                        <option value="1mo">1mo</option>
                    </select>
                </label>
            </div>

            <div className={styles.card} style={{ height: 380 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={['p_total', 'voltage', 'current']} labels={SERIES_LABELS} />
                )}
            </div>

            <div className={styles.card}>
                <h3 className={styles.section}>요약 통계</h3>
                <StatsPanel stats={stats} labels={SERIES_LABELS} />
            </div>
        </div>
    );
}
