/**
 * Home Presenter
 * - Dashboard 스타일 카드 레이아웃
 * - 1024x768 기준 2x2 Grid, 반응형
 * - RealtimeGauge, 미니 차트, 단순 카드 표시
 */
import RealtimeGauge from '../../components/charts/RealtimeGauge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

type Props = {
    realtime: number | null;
    todayEnergy: number | null;
    temp: number | null;
    humidity: number | null;
    solar: number | null;
};

export default function HomePresenter({ realtime, todayEnergy, temp, humidity, solar }: Props) {
    // 오늘 전력량 미니 차트용 임시 데이터 (실제는 API에서 집계 데이터 받으면 교체)
    const todayData = [
        { time: '00:00', energy: 0 },
        { time: '06:00', energy: 1.2 },
        { time: '12:00', energy: 3.5 },
        { time: '18:00', energy: 6.8 },
        { time: '23:59', energy: todayEnergy ?? 7.2 },
    ];

    return (
        <div className="page">
            <header className="page__header">
                <h1>Dashboard</h1>
            </header>

            <main className="page__content">
                <section className="grid">
                    {/* 실시간 전력 */}
                    <div className="card">
                        <h2 className="card__title">실시간 전력</h2>
                        <RealtimeGauge value={realtime ?? 0} maxKw={10} />
                    </div>

                    {/* 오늘 전력량 */}
                    <div className="card">
                        <h2 className="card__title">오늘 전력량</h2>
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer>
                                <AreaChart data={todayData}>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="energy" stroke="#3b82f6" fill="#bfdbfe" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            {todayEnergy != null ? `${todayEnergy.toFixed(2)} kWh` : '-'}
                        </div>
                    </div>

                    {/* 온도/습도 */}
                    <div className="card">
                        <h2 className="card__title">온도 / 습도</h2>
                        <div className="flex-col">
                            <span>온도: {temp != null ? `${temp} °C` : '-'}</span>
                            <span>습도: {humidity != null ? `${humidity} %` : '-'}</span>
                        </div>
                    </div>

                    {/* 일사량 */}
                    <div className="card">
                        <h2 className="card__title">일사량</h2>
                        <div className="flex-col">
                            <span>{solar != null ? `${solar} W/m²` : '-'}</span>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
        .page { min-height:100vh; background:#f6f7fb; color:#1f2937; }
        .page__header { padding:12px 16px; background:#111827; color:#fff; }
        .page__header h1 { margin:0; font-size:18px; }
        .page__content { padding:12px; max-width:1400px; margin:0 auto; }

        .grid {
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:12px;
        }
        @media (max-width:768px) {
          .grid { grid-template-columns: 1fr; }
        }

        .card {
          background:#fff;
          border-radius:12px;
          box-shadow:0 1px 4px rgba(0,0,0,.08);
          padding:12px;
          min-height:220px;
        }
        .card__title { margin:0 0 8px; font-size:16px; font-weight:600; }
        .flex-col { display:flex; flex-direction:column; gap:4px; font-size:14px; }
      `}</style>
        </div>
    );
}
