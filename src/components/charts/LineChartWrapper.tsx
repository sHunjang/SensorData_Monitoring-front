/**
 * 시간축 라인 차트 공용 컴포넌트
 * - Recharts 사용
 * - 좌측 축: kW(p_total), 우측 축: V(voltage)/A(current)
 * - 반응형 컨테이너로 부모 영역에 자동 적응
 */
import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { ModbusPoint } from '../../api/modbusApi';

/** 날짜 라벨 포매터: HH:mm 혹은 MM-DD HH:mm */
function formatTick(ts: string) {
    const d = new Date(ts);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${h}:${m}`;
}

type Props = {
    data: ModbusPoint[];
    height?: number; // 필요시 높이 지정, 미지정 시 부모 높이에 맞춤
};

export default function LineChartWrapper({ data, height }: Props) {
    // null 값은 차트에 그리기 어렵기 때문에 그대로 두되 툴팁에서만 주의
    const chartData = useMemo(() => data, [data]);

    return (
        <div style={{ width: '100%', height: height ?? '100%' }}>
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" tickFormatter={formatTick} minTickGap={24} />
                    {/* 좌측: kW */}
                    <YAxis yAxisId="left" tickCount={6} />
                    {/* 우측: V/A (스케일이 커서 분리) */}
                    <YAxis yAxisId="right" orientation="right" tickCount={6} />
                    <Tooltip
                        labelFormatter={(v) => formatTick(String(v))}
                        formatter={(value: any, name) => {
                            if (value == null) return ['-', name];
                            return [value, name];
                        }}
                    />
                    <Legend />
                    {/* 전력(kW) */}
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="p_total"
                        name="P_total(kW)"
                        dot={false}
                        strokeWidth={2}
                    />
                    {/* 전압(V) */}
                    <Line yAxisId="right" type="monotone" dataKey="voltage" name="Voltage(V)" dot={false} />
                    {/* 전류(A) */}
                    <Line yAxisId="right" type="monotone" dataKey="current" name="Current(A)" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
