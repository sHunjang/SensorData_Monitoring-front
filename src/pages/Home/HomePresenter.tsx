/**
 * HomePresenter.tsx
 * - HomeContainer에서 받은 데이터를 UI로 표시
 * - 카드 4개: 실시간 전력량, 당일 전력량, 온도/습도, 일조량
 */
import styles from './HomePresenter.module.css';
import Error from '@/components/common/Error';

type Props = {
    power: number | null;
    todayKwh: number | null;
    temperature: number | null;
    humidity: number | null;
    solar: number | null;
    powerError: string | null;
    todayError: string | null;
    envError: string | null;
    solarError: string | null;
};

export default function HomePresenter({
    power,
    todayKwh,
    temperature,
    humidity,
    solar,
    powerError,
    todayError,
    envError,
    solarError,
}: Props) {
    return (
        <div className={styles.grid}>
            {/* 실시간 전력 */}
            <div className={styles.card}>
                <h3>실시간 전력 (kW)</h3>
                {powerError ? (
                    <Error msg={powerError} />
                ) : (
                    <div className={styles.value}>{power != null ? `${power} kW` : '-'}</div>
                )}
            </div>

            {/* 당일 전력량 */}
            <div className={styles.card}>
                <h3>당일 전력량 (kWh)</h3>
                {todayError ? (
                    <Error msg={todayError} />
                ) : (
                    <div className={styles.value}>{todayKwh != null ? `${todayKwh.toFixed(2)} kWh` : '-'}</div>
                )}
            </div>

            {/* 온습도 */}
            <div className={styles.card}>
                <h3>온도 / 습도</h3>
                {envError ? (
                    <Error msg={envError} />
                ) : (
                    <div className={styles.value}>
                        {temperature != null ? `${temperature} ℃` : '-'} / {humidity != null ? `${humidity} %` : '-'}
                    </div>
                )}
            </div>

            {/* 일사량 */}
            <div className={styles.card}>
                <h3>일사량 (W/m²)</h3>
                {solarError ? (
                    <Error msg={solarError} />
                ) : (
                    <div className={styles.value}>{solar != null ? `${solar} W/m²` : '-'}</div>
                )}
            </div>
        </div>
    );
}
