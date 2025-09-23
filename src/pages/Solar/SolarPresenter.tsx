/**
 * SolarPresenter.tsx
 *
 * 목적:
 * - SolarContainer로부터 받은 데이터로 UI를 구성.
 * - 차트 / 통계 / 로그 / 컨트롤을 배치.
 */
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Error from '@/components/common/Error';
import PeriodControls, { Preset } from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';

export default function SolarPresenter(p: {
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    preset: Preset;
    setPreset: (p: Preset) => void;
    onQuery: () => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];
}) {
    const { mode, setMode, preset, setPreset, onQuery, data, stats, loading, error, logs } = p;
    const lastVal = data?.length ? data[data.length - 1]?.solar ?? null : null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <SummaryText title="일사량" unit="W/m²" mode={mode} realtimeValue={lastVal} stats={stats?.solar} />
            </div>

            <PeriodControls
                mode={mode}
                setMode={setMode}
                preset={preset}
                setPreset={setPreset}
                onQuery={onQuery}
                loading={loading}
            />

            <div className={styles.card} style={{ height: 360 }}>
                {error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={['solar']} labels={{ solar: '일사량(W/m²)' }} />
                )}
            </div>

            <div className={styles.card}>
                <h3 className={styles.section}>요약 통계</h3>
                <StatsPanel title="요약 통계" stats={stats ?? {}} />
            </div>

            <div className={styles.card}>
                <LogPanel logs={logs} />
            </div>
        </div>
    );
}
