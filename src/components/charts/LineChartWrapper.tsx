// src/components/charts/LineChartWrapper.tsx
/**
 * 범용 라인차트
 * props:
 *  - data: [{ bucket: ISO, <series>: number|null }]
 *  - keys: 표시할 시리즈 키 배열
 *  - labels: 키→표시라벨
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
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="bucket" tickFormatter={(v: string) => v?.slice(5, 16)} />
                <YAxis />
                <Tooltip />
                <Legend />
                {keys.map((k) => (
                    <Line key={k} type="monotone" dataKey={k} name={labels[k] ?? k} dot={false} strokeOpacity={0.9} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
