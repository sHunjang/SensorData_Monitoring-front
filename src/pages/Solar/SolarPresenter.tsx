/**
 * SolarPresenter.tsx
 * - 일사량 페이지 UI
 * - 컨트롤(프리셋) + 라인차트 + 통계
 */

import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatsPanel from '@/components/metrics/StatsPanel';

const LABELS: Record<string, string> = {
    solar: '일사량(W/m²)',
};

type Props = {
    preset: '15m' | '1h' | '1d' | '1w' | '1mo';
    setPreset: (p: Props['preset']) => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
};

export default function SolarPresenter({ preset, setPreset, data, stats, loading, error }: Props) {
    return (
        <div className="grid" style={{ padding: 16, gap: 12 }}>
            {/* 컨트롤 */}
            <div className="card">
                <label>
                    Interval
                    <select
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as Props['preset'])}
                        style={{ marginLeft: 8 }}
                    >
                        <option value="15m">15분</option>
                        <option value="1h">1시간</option>
                        <option value="1d">1일</option>
                        <option value="1w">1주</option>
                        <option value="1mo">1달</option>
                    </select>
                </label>
            </div>

            {/* 차트 */}
            <div className="card" style={{ height: 360 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={['solar']} labels={LABELS} />
                )}
            </div>

            {/* 통계 */}
            <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>요약 통계</h3>
                <StatsPanel stats={stats} labels={LABELS} />
            </div>
        </div>
    );
}
