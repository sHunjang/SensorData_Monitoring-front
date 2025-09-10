/**
 * StatsPanel
 * - 선택된 series 통계만 표시
 */
import styles from './StatsPanel.module.css';

type Stat = {
    avg: number | null;
    max: number | null;
    min: number | null;
    count: number;
};

export default function StatsPanel({
    stats,
    labels,
    selectedKeys,
}: {
    stats: Record<string, Stat>;
    labels: Record<string, string>;
    selectedKeys: string[];
}) {
    const fmt = (v: number | null) => (v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2));

    return (
        <div className={styles.grid}>
            {selectedKeys.map((key) => {
                const s = stats[key];
                if (!s) return null;
                return (
                    <div key={key} className={styles.item}>
                        <h4 className={styles.label}>{labels[key] ?? key}</h4>
                        <div className={styles.values}>
                            <span>평균: {fmt(s.avg)}</span>
                            <span>최대: {fmt(s.max)}</span>
                            <span>최소: {fmt(s.min)}</span>
                            <span>개수: {s.count}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
