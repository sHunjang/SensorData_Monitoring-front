// src/pages/Env/EnvPresenter.tsx
import styles from './Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatsPanel from '@/components/metrics/StatsPanel';
import { SERIES_LABELS } from '@/constants/labels';

export default function EnvPresenter({
    preset,
    setPreset,
    data,
    stats,
    loading,
    error,
}: {
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

            <div className={styles.card} style={{ height: 360 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={['temperature', 'humidity']} labels={SERIES_LABELS} />
                )}
            </div>

            <div className={styles.card}>
                <h3 className={styles.section}>요약 통계</h3>
                <StatsPanel stats={stats} labels={SERIES_LABELS} />
            </div>
        </div>
    );
}
