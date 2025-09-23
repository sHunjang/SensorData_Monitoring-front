/**
 * EnvPresenter.tsx
 *
 * 목적:
 * - EnvContainer에서 제공하는 상태를 받아 UI로 렌더링.
 * - 차트, 통계, 로그, 컨트롤을 배치.
 */
import styles from './Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import PeriodControls, { Preset } from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';

export default function EnvPresenter(p: {
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
    const last = data?.length ? data[data.length - 1] : null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'grid', gap: 6 }}>
                    <SummaryText
                        title="온도"
                        unit="°C"
                        mode={mode}
                        realtimeValue={last?.temperature ?? null}
                        stats={stats?.temperature}
                    />
                    <SummaryText
                        title="습도"
                        unit="%"
                        mode={mode}
                        realtimeValue={last?.humidity ?? null}
                        stats={stats?.humidity}
                    />
                </div>
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
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper
                        data={data}
                        keys={['temperature', 'humidity']}
                        labels={{ temperature: '온도(°C)', humidity: '습도(%)' }}
                    />
                )}
            </div>

            <div className={styles.card}>
                <StatsPanel title="요약 통계" stats={stats ?? {}} />
            </div>

            <div className={styles.card}>
                <LogPanel logs={logs} />
            </div>
        </div>
    );
}
