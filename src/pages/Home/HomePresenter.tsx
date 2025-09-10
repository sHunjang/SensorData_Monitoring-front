/**
 * HomePresenter.tsx
 * - HomeContainer에서 받은 데이터를 UI로 표시
 * - 카드 4개: 실시간 전력량, 당일 전력량, 온도/습도, 일조량
 */
import styles from './HomePresenter.module.css';

type Props = {
    power: number | null;
    todayKwh: number | null;
    temperature: number | null;
    humidity: number | null;
    solar: number | null;
};

export default function HomePresenter({ power, todayKwh, temperature, humidity, solar }: Props) {
    const fmt = (v: number | null, unit: string) => (v == null ? '-' : `${v.toFixed(2)} ${unit}`);

    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <h3>실시간 전력량</h3>
                <div className={styles.value}>{fmt(power, 'kW')}</div>
            </div>
            <div className={styles.card}>
                <h3>당일 전력량</h3>
                <div className={styles.value}>{fmt(todayKwh, 'kWh')}</div>
            </div>
            <div className={styles.card}>
                <h3>실시간 온도/습도</h3>
                <div className={styles.value}>
                    {fmt(temperature, '°C')} / {fmt(humidity, '%')}
                </div>
            </div>
            <div className={styles.card}>
                <h3>실시간 일사량</h3>
                <div className={styles.value}>{fmt(solar, 'W/m²')}</div>
            </div>
        </div>
    );
}
