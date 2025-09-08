import RealtimeGauge from '../../components/charts/RealtimeGauge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import styles from './HomePresenter.module.css';

type Props = {
    realtime: number | null;
    todayEnergy: number | null;
    temp: number | null;
    humidity: number | null;
    solar: number | null;
};

export default function HomePresenter({ realtime, todayEnergy, temp, humidity, solar }: Props) {
    // 오늘 전력량 임시 데이터 (나중에 API 연결 시 교체)
    const todayData = [
        { time: '00:00', energy: 0 },
        { time: '06:00', energy: 1.2 },
        { time: '12:00', energy: 3.5 },
        { time: '18:00', energy: 6.8 },
        { time: '23:59', energy: todayEnergy ?? 7.2 },
    ];

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>🏠 Home Dashboard</h1>

            <div className={styles.grid}>
                {/* 실시간 전력 */}
                <div className={styles.card}>
                    <h2>실시간 전력</h2>
                    <RealtimeGauge value={realtime ?? 0} maxKw={10} />
                </div>

                {/* 오늘 전력량 */}
                <div className={styles.card}>
                    <h2>오늘 전력량</h2>
                    <div className={styles.miniChart}>
                        <ResponsiveContainer>
                            <AreaChart data={todayData}>
                                <XAxis dataKey="time" hide />
                                <YAxis hide />
                                <Tooltip />
                                <Area type="monotone" dataKey="energy" stroke="#3b82f6" fill="#bfdbfe" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className={styles.value}>{todayEnergy != null ? `${todayEnergy.toFixed(2)} kWh` : '-'}</div>
                </div>

                {/* 온도/습도 */}
                <div className={styles.card}>
                    <h2>온도 / 습도</h2>
                    <p>온도: {temp != null ? `${temp} °C` : '-'}</p>
                    <p>습도: {humidity != null ? `${humidity} %` : '-'}</p>
                </div>

                {/* 일사량 */}
                <div className={styles.card}>
                    <h2>일사량</h2>
                    <p>{solar != null ? `${solar} W/m²` : '-'}</p>
                </div>
            </div>
        </div>
    );
}
