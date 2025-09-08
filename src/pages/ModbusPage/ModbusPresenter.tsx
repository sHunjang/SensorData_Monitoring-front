/**
 * Presenter
 * - 순수 UI 레이아웃
 * - 반응형 Grid로 1024x768 기준 + 확장 대응
 */
import LineChartWrapper from '../../components/charts/LineChartWrapper';
import RealtimeGauge from '../../components/charts/RealtimeGauge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import type { ModbusPoint } from '../../api/modbusApi';

type Props = {
    data: ModbusPoint[];
    realtime: number | null;
    loading: boolean;
    error: string | null;
};

export default function ModbusPresenter({ data, realtime, loading, error }: Props) {
    return (
        <div className="page">
            <header className="page__header">
                <h1>Modbus Monitoring</h1>
            </header>

            <main className="page__content">
                {/* 좌측: 실시간 게이지, 우측: 라인 차트 */}
                <section className="grid">
                    <div className="card">
                        <h2 className="card__title">실시간 전력</h2>
                        {loading ? (
                            <LoadingSpinner />
                        ) : error ? (
                            <ErrorMessage message={error} />
                        ) : (
                            <RealtimeGauge value={realtime ?? 0} />
                        )}
                    </div>

                    <div className="card card--span2">
                        <div className="card__header">
                            <h2 className="card__title">시간별 전력 추이</h2>
                            <div className="card__hint">버킷: 1h 평균</div>
                        </div>
                        {loading ? (
                            <LoadingSpinner />
                        ) : error ? (
                            <ErrorMessage message={error} />
                        ) : (
                            <div style={{ height: 360 }}>
                                <LineChartWrapper data={data} />
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <style>{`
        .page { min-height: 100vh; background:#f6f7fb; color:#1f2937; }
        .page__header { padding:12px 16px; background:#111827; color:#fff; }
        .page__header h1 { margin:0; font-size:18px; }

        .page__content { padding:12px; max-width:1400px; margin:0 auto; }

        /* 반응형 Grid: 기본 1열, 넓으면 3열(게이지 1, 차트 2) */
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 1024px) {
          .grid { grid-template-columns: 1fr 2fr; }
        }

        .card {
          background:#fff;
          border-radius:12px;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          padding: 12px;
          min-height: 220px;
        }
        .card--span2 { grid-column: span 1; }
        @media (min-width: 1024px) {
          .card--span2 { grid-column: span 1; }
        }
        .card__header {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:8px;
        }
        .card__title { margin:0; font-size:16px; font-weight:700; }
        .card__hint { font-size:12px; color:#6b7280; }
      `}</style>
        </div>
    );
}
