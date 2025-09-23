/**
 * ModbusPresenter.tsx
 *
 * 목적:
 * - ModbusContainer에서 제공하는 상태를 바탕으로 UI 구성(컨트롤/차트/통계/로그)
 *
 * 주의:
 * - column 키 이름은 백엔드에서 반환하는 필드와 일치해야 함.
 */
import styles from '../Env/Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Error from '@/components/common/Error';
import PeriodControls from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';

type SeriesKey = 'power' | 'current' | 'voltage' | 'energy' | 'pf';

export default function ModbusPresenter(p: {
    deviceId: number;
    setDeviceId: (n: number) => void;
    column: SeriesKey;
    setColumn: (s: SeriesKey) => void;
    preset: any;
    setPreset: (p: any) => void;
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    onQuery: () => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];
}) {
    const {
        deviceId,
        setDeviceId,
        column,
        setColumn,
        preset,
        setPreset,
        mode,
        setMode,
        onQuery,
        data,
        stats,
        error,
        logs,
    } = p;
    const lastVal = data?.length ? data[data.length - 1]?.[column] ?? null : null;
    const unit =
        column === 'energy'
            ? 'kWh'
            : column === 'power'
            ? 'kW'
            : column === 'current'
            ? 'A'
            : column === 'voltage'
            ? 'V'
            : '';

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <SummaryText
                    title={`모드버스 · ${column}`}
                    unit={unit}
                    mode={mode}
                    realtimeValue={lastVal}
                    stats={stats?.[column]}
                />
            </div>

            <div className={styles.controls}>
                <label>
                    장치 ID
                    <input
                        type="number"
                        value={deviceId}
                        onChange={(e) => setDeviceId(Number(e.target.value))}
                        className={styles.input}
                    />
                </label>

                <label>
                    데이터
                    <select
                        value={column}
                        onChange={(e) => setColumn(e.target.value as SeriesKey)}
                        className={styles.input}
                    >
                        <option value="power">전력(kW)</option>
                        <option value="current">전류(A)</option>
                        <option value="voltage">전압(V)</option>
                        <option value="energy">전력량(kWh)</option>
                        <option value="pf">역률</option>
                    </select>
                </label>

                <PeriodControls
                    mode={mode}
                    setMode={setMode}
                    preset={preset}
                    setPreset={setPreset}
                    onQuery={onQuery}
                    loading={false}
                />
            </div>

            <div className={styles.card} style={{ height: 360 }}>
                {error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={[column]} labels={{ [column]: column }} />
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
