/**
 * StatsPanel.tsx
 *
 * 목적:
 * - 통계 객체(평균/최대/최소/개수)를 여럿 렌더링.
 *
 * props:
 * - title: string
 * - stats: Record<string, {avg,max,min,count}>
 *
 * 동작:
 * - stats가 비어있으면 '데이터 없음' 표시.
 */
import styles from './StatsPanel.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
type Props = { title: string; stats: Record<string, Stat> };

const fmt = (n: number | null | undefined, d = 2) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d) : '—');

export default function StatsPanel({ title, stats }: Props) {
    const entries = Object.entries(stats ?? {});
    return (
        <section>
            <h4 style={{ margin: '0 0 8px 0' }}>{title}</h4>
            {entries.length === 0 ? (
                <p>데이터 없음</p>
            ) : (
                <div className={styles.grid}>
                    {entries.map(([k, s]) => (
                        <div key={k} className={styles.item}>
                            <div className={styles.label}>{k}</div>
                            <div className={styles.values}>
                                <div>평균: {fmt(s?.avg)}</div>
                                <div>최고: {fmt(s?.max)}</div>
                                <div>최저: {fmt(s?.min)}</div>
                                <div>개수: {s?.count ?? 0}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
