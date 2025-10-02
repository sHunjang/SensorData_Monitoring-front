/**
 * SummaryBar.tsx
 *
 * 목적:
 * - 대시보드 상단의 요약 카드 컴포넌트.
 * - 실시간/구간 평균을 모두 지원.
 *
 * props:
 * - title, unit, mode (realtime|range), realtimeValue, stats, seriesData(스파크라인)
 */
import styles from './SummaryBar.module.css';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

export type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

function fmt(n: number | null | undefined, d = 3) {
    if (n == null || Number.isNaN(n)) return '—';
    const abs = Math.abs(n);
    const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : d;
    return Number(n).toFixed(digits);
}

type CardProps = {
    title: string;
    unit?: string;
    mode: 'realtime' | 'range';
    realtimeValue?: number | null;
    stats?: Stat;
    windowText?: string;
    seriesData?: Array<{ x: string; y: number | null }>;
    higherIsBetter?: boolean;
};

export default function SummaryBar({
    title,
    unit,
    mode,
    realtimeValue,
    stats,
    windowText,
    seriesData,
    higherIsBetter = true,
}: CardProps) {
    const value = mode === 'realtime' ? realtimeValue : stats?.avg ?? null;

    let trendClass = styles.neutral;
    if (seriesData && seriesData.length >= 2) {
        const nums = seriesData.map((d) => d.y).filter((v): v is number => v != null);
        if (nums.length >= 2) {
            const diff = nums[nums.length - 1] - nums[0];
            const good = higherIsBetter ? diff > 0 : diff < 0;
            const bad = higherIsBetter ? diff < 0 : diff > 0;
            trendClass = good ? styles.good : bad ? styles.bad : styles.neutral;
        }
    }

    return (
        <div className={styles.card}>
            {seriesData && seriesData.length > 1 && (
                <div className={styles.spark}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={seriesData}>
                            <Line type="monotone" dataKey="y" dot={false} strokeWidth={2} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className={styles.body}>
                <div className={styles.title}>
                    <span>{title}</span>
                    {unit ? <span className={styles.badge}>{unit}</span> : null}
                </div>

                <div className={`${styles.value} ${trendClass}`.trim()}>
                    {fmt(value)}
                    {unit ? <span className={styles.unit}>{unit}</span> : null}
                </div>

                {mode === 'range' && stats && (
                    <div className={styles.rows}>
                        <div className={styles.kv}>평균 {fmt(stats.avg)}</div>
                        <div className={styles.kv}>최고 {fmt(stats.max)}</div>
                        <div className={styles.kv}>최저 {fmt(stats.min)}</div>
                        <div className={styles.kv}>개수 {stats.count ?? 0}</div>
                    </div>
                )}
            </div>

            {mode === 'range' && windowText && <div className={styles.footer}>{windowText}</div>}
        </div>
    );
}
