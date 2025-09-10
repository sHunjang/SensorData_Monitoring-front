/**
 * 홈 대시보드
 * - 4개 타일: 실시간 유효전력(p_kw), 당일 전력량(e_kwh),
 *             온도/습도, 일사량
 * - 값은 소수점 둘째 자리까지 표시
 */
import styles from './Home.module.css';

function fmt(v: number | null, suffix?: string) {
    if (v === null || v === undefined || isNaN(v)) return '-';
    return v.toFixed(2) + (suffix ? ` ${suffix}` : '');
}

function Tile({ title, value }: { title: string; value: string }) {
    return (
        <section className={styles.card}>
            <div className={styles.title}>{title}</div>
            <div className={styles.value}>{value}</div>
        </section>
    );
}

export default function HomePresenter({
    kw,
    kwh,
    temperature,
    humidity,
    solar,
}: {
    kw: number | null;
    kwh: number | null;
    temperature: number | null;
    humidity: number | null;
    solar: number | null;
}) {
    return (
        <div className={styles.grid}>
            <Tile title="실시간 유효전력" value={fmt(kw, 'kW')} />
            <Tile title="당일 전력량" value={fmt(kwh, 'kWh')} />
            <Tile title="온도 / 습도" value={`${fmt(temperature, '°C')} / ${fmt(humidity, '%')}`} />
            <Tile title="일사량" value={fmt(solar, 'W/m²')} />
        </div>
    );
}
