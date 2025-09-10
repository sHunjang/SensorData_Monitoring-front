/**
 * ModbusPresenter.tsx
 * - 전력량계 화면 UI
 * - 컨트롤(장치ID, 컬럼, 기간, 조회 버튼)
 * - 그래프(LineChartWrapper)
 * - 방향/줌인아웃 버튼
 * - 통계(StatsPanel)
 */
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatsPanel from '@/components/metrics/StatsPanel';
import { DEVICES } from '@/constants/devices';

const COLUMN_LABELS: Record<string, string> = {
    total_active_power_kW: '유효전력(kW)',
    total_reactive_power_kvar: '무효전력(kvar)',
    total_apparent_power_kVA: '피상전력(kVA)',
    voltage: '전압(V)',
    current: '전류(A)',
    total_active_energy_kWh: '전력량(kWh)',
};

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    column: string;
    setColumn: (c: string) => void;
    preset: '15m' | '1h' | '1d' | '1w' | '1mo';
    setPreset: (p: Props['preset']) => void;
    onQuery: () => void;
    onShift: (dir: 'left' | 'right') => void;
    onZoom: (dir: 'in' | 'out') => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
};

export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    column,
    setColumn,
    preset,
    setPreset,
    onQuery,
    onShift,
    onZoom,
    data,
    stats,
    loading,
    error,
}: Props) {
    return (
        <div className="grid" style={{ padding: 16, gap: 12 }}>
            {/* 컨트롤 */}
            <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label>
                    Device
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(Number(e.target.value))}
                        style={{ marginLeft: 8 }}
                    >
                        {DEVICES.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name} (ID={d.id})
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Column
                    <select value={column} onChange={(e) => setColumn(e.target.value)} style={{ marginLeft: 8 }}>
                        {Object.keys(COLUMN_LABELS).map((c) => (
                            <option key={c} value={c}>
                                {COLUMN_LABELS[c]}
                            </option>
                        ))}
                    </select>
                </label>

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

                <button onClick={onQuery} style={{ padding: '6px 12px' }}>
                    조회
                </button>
            </div>

            {/* 그래프 */}
            <div className="card" style={{ height: 380 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={[column]} labels={COLUMN_LABELS} />
                )}
            </div>

            {/* 좌우/줌 버튼 */}
            <div className="card" style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onShift('left')}>← 좌</button>
                <button onClick={() => onShift('right')}>우 →</button>
                <button onClick={() => onZoom('in')}>＋ 줌인</button>
                <button onClick={() => onZoom('out')}>－ 줌아웃</button>
            </div>

            {/* 통계 */}
            <div className="card">
                <h3 style={{ margin: '0 0 8px 0' }}>요약 통계</h3>
                <StatsPanel stats={stats} labels={COLUMN_LABELS} />
            </div>
        </div>
    );
}
