import LineChartWrapper from '../../components/charts/LineChartWrapper';
import styles from './ModbusPresenter.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    series: string;
    setSeries: (s: string) => void;
    preset: string;
    setPreset: (p: string) => void;
    result: {
        window: { start: string; end: string };
        device_id: number;
        series: string[];
        data: any[];
        stats: Record<string, Stat>;
    } | null;
    onQuery: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
};

export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    series,
    setSeries,
    preset,
    setPreset,
    result,
    onQuery,
    onPrev,
    onNext,
    onZoomIn,
    onZoomOut,
}: Props) {
    const presets = [
        { value: '15m', label: '15분' },
        { value: '1h', label: '1시간' },
        { value: '1d', label: '1일' },
        { value: '1w', label: '1주' },
        { value: '1mo', label: '1달' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* 타이틀 */}
                <h1 className={styles.title}>📊 전력 데이터 조회</h1>

                {/* 조회 조건 Form */}
                <div className={styles.form}>
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(Number(e.target.value))}
                        className={styles.select}
                    >
                        {[11, 12, 13, 14, 15].map((id) => (
                            <option key={id} value={id}>
                                장치 {id}
                            </option>
                        ))}
                    </select>

                    <select value={series} onChange={(e) => setSeries(e.target.value)} className={styles.select}>
                        <option value="voltage">전압(V)</option>
                        <option value="current">전류(A)</option>
                        <option value="p_total">유효전력(kW)</option>
                        <option value="q_total">무효전력(kvar)</option>
                        <option value="s_total">피상전력(kVA)</option>
                        <option value="pf_total">역률</option>
                    </select>

                    <select value={preset} onChange={(e) => setPreset(e.target.value)} className={styles.select}>
                        {presets.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    <button onClick={onQuery} className={styles.button}>
                        조회
                    </button>
                </div>

                {/* 기간 표시 */}
                {result && (
                    <p className={styles.period}>
                        {result.window.start.slice(0, 10)} ~ {result.window.end.slice(0, 10)}
                    </p>
                )}

                {/* 그래프 */}
                <div className={styles.chart}>
                    {result ? <LineChartWrapper data={result.data} /> : '조회 버튼을 눌러 데이터를 확인하세요'}
                </div>

                {/* 하단 통계 + 버튼 */}
                {result && (
                    <div className={styles.bottom}>
                        <div className={styles.statsGrid}>
                            {result.series
                                .filter((s) => s === series)
                                .map((s) => {
                                    const stat = result.stats[s];
                                    return (
                                        <div key={s} className={styles.statCard}>
                                            <p className={styles.statTitle}>
                                                {s === 'voltage' && '전압(V)'}
                                                {s === 'current' && '전류(A)'}
                                                {s === 'p_total' && '유효전력(kW)'}
                                                {s === 'q_total' && '무효전력(kvar)'}
                                                {s === 's_total' && '피상전력(kVA)'}
                                                {s === 'pf_total' && '역률'}
                                            </p>
                                            <p className={styles.statText}>평균: {stat.avg ?? '-'}</p>
                                            <p className={styles.statText}>최대: {stat.max ?? '-'}</p>
                                            <p className={styles.statText}>최소: {stat.min ?? '-'}</p>
                                            <p className={styles.statText}>데이터 개수: {stat.count}</p>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* 네비게이션 버튼 */}
                        <div className={styles.navButtons}>
                            <button onClick={onPrev} className={styles.navButton}>
                                ◀ 이전
                            </button>
                            <button onClick={onNext} className={styles.navButton}>
                                다음 ▶
                            </button>
                            <button onClick={onZoomIn} className={styles.navButton}>
                                + 확대
                            </button>
                            <button onClick={onZoomOut} className={styles.navButton}>
                                - 축소
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
