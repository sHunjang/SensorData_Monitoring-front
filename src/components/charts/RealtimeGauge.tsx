/**
 * 실시간 전력 게이지(라디얼 바)
 * - 최대값(maxKw) 기준 비율로 표시
 * - 값과 단위를 중앙에 텍스트로 출력
 */
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

type Props = {
    value: number; // kW
    maxKw?: number; // 게이지 최대값(디폴트 10kW)
};

export default function RealtimeGauge({ value, maxKw = 10 }: Props) {
    const val = Math.max(0, value ?? 0);
    const percent = Math.min(100, (val / maxKw) * 100);
    const data = [{ name: 'kW', value: percent }];

    return (
        <div style={{ width: '100%', height: 260, position: 'relative' }}>
            <ResponsiveContainer>
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={18}
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                    <RadialBar dataKey="value" cornerRadius={18} background />
                </RadialBarChart>
            </ResponsiveContainer>
            {/* 중앙 텍스트 */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ fontSize: 14, color: '#666' }}>Realtime Power</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{val.toFixed(2)} kW</div>
                <div style={{ fontSize: 12, color: '#999' }}>Max {maxKw} kW</div>
            </div>
        </div>
    );
}
