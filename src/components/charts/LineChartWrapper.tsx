// src/components/charts/LineChartWrapper.tsx
/**
 * 범용 라인차트
 * - Tooltip 값은 소수점 둘째 자리까지 표시
 */
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LineChartWrapper({
    data,
    keys,
    labels,
}: {
    data: any[];
    keys: string[];
    labels: Record<string, string>;
}) {
    const fmt = (v: any) => (v === null || v === undefined || isNaN(v) ? '-' : Number(v).toFixed(2));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis
                    dataKey="bucket"
                    tickFormatter={(v: string) => (typeof v === 'string' ? v.slice(5, 16) : v)}
                    tick={{ fontSize: 14 }}
                />
                <YAxis tick={{ fontSize: 14 }} />
                <Tooltip formatter={(value) => fmt(value)} contentStyle={{ fontSize: 14 }} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                {keys.map((k, i) => (
                    <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={labels[k] ?? k}
                        dot={false}
                        strokeOpacity={0.9}
                        strokeWidth={2}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
