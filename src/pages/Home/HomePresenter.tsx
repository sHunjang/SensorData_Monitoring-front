// src/pages/Home/HomePresenter.tsx
/** 홈 프레젠터: 반응형 카드 UI */
import styles from './Home.module.css';
export default function HomePresenter({ kw }: { kw: number | null }) {
    return (
        <div className={styles.grid}>
            <section className={styles.card}>
                <div className={styles.title}>실시간 유효전력(kW)</div>
                <div className={styles.value}>{kw ?? '-'}</div>
                <div className={styles.hint}>device_id=11</div>
            </section>
        </div>
    );
}
