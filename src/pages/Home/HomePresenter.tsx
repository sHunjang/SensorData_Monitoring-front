/**
 * HomePresenter.tsx
 *
 * 목적:
 * - 홈 대시보드의 UI 구성. 4개의 카드 표시.
 * - 각 카드별로 에러/빈값을 안전하게 처리.
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
    const fmt = (v: number | null | undefined, digits = 2) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';
    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <h3>실시간 전력 (kW)</h3>
                {powerError ? <Error msg={powerError} /> : <div className={styles.value}>{fmt(power)}</div>}
            </div>

            <div className={styles.card}>
                <h3>당일 전력량 (kWh)</h3>
                {todayError ? (
                    <Error msg={todayError} />
                ) : (
                    <div className={styles.value}>{todayKwh != null ? `${todayKwh.toFixed(2)} kWh` : '-'}</div>
                )}
            </div>

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
