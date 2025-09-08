import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SERIES_LABELS } from '../../constants/labels';

type Props = { data: any[] };

export default function LineChartWrapper({ data }: Props) {
    if (!data || data.length === 0) return <p>데이터가 없습니다.</p>;

    // keys 추출 (bucket 제외)
    const keys = Object.keys(data[0]).filter((k) => k !== 'bucket');

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number, name: string) => [`${value}`, SERIES_LABELS[name] ?? name]} />
                <Legend formatter={(value: string) => SERIES_LABELS[value] ?? value} />
                {keys.map((key, idx) => (
                    <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={SERIES_LABELS[key] ?? key} // 범례 한글화
                        stroke={['#2563eb', '#10b981', '#f59e0b'][idx % 3]}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
