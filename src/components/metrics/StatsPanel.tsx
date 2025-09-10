/**
 * StatsPanel
 * - stats 객체에 있는 모든 시리즈를 자동으로 표시
 * - labels 에 매핑이 있으면 라벨로, 없으면 키 이름 그대로 사용
 */
import styles from './StatsPanel.module.css';

type Stat = {
    avg: number | null;
    max: number | null;
    min: number | null;
    count: number;
};

export default function StatsPanel({ stats, labels }: { stats: Record<string, Stat>; labels: Record<string, string> }) {
    const fmt = (v: number | null) => (v === null || v === undefined || isNaN(v) ? '-' : v.toFixed(2));

    return (
        <div className={styles.grid}>
            {Object.entries(stats).map(([key, s]) => (
                <div key={key} className={styles.item}>
                    <h4 className={styles.label}>{labels[key] ?? key}</h4>
                    <div className={styles.values}>
                        <span>평균: {fmt(s.avg)}</span>
                        <span>최대: {fmt(s.max)}</span>
                        <span>최소: {fmt(s.min)}</span>
                        <span>개수: {s.count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
