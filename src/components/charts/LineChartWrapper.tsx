// src/components/charts/LineChartWrapper.tsx
/**
 * LineChartWrapper
 *
 * - Recharts 기반 범용 라인 차트 래퍼
 * - X축은 epoch(ms) 숫자 타입을 기대함 (type="number", scale="time")
 * - 툴팁/틱 포맷은 KST(Asia/Seoul)로 포맷
 *
 * 중요:
 * - data[].bucket 이 숫자(epoch ms)여야 정상 동작.
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

type Props = {
    data: any[];
    keys: string[];
    labels?: Record<string, string>;
    xKey?: string;
};

function fmtTimeKst(epochMs?: number | null) {
    if (epochMs == null) return '';
    const d = new Date(Number(epochMs));
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
        hour12: false,
    }).format(d);
}

export default function LineChartWrapper({ data, keys, labels = {}, xKey = 'bucket' }: Props) {
    if (!data || !data.length) {
        return <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#888' }}>데이터 없음</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xKey}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    tickFormatter={(ts) => fmtTimeKst(ts as number)}
                    minTickGap={24}
                />
                <YAxis allowDecimals />
                <Tooltip
                    labelFormatter={(v) => {
                        if (v == null) return '';
                        const d = new Date(Number(v));
                        return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
                    }}
                />
                <Legend />
                {keys.map((k) => (
                    <Line
                        key={k}
                        type="monotone"
                        dataKey={k}
                        name={labels[k] ?? k}
                        dot={false}
                        isAnimationActive={false}
                        strokeWidth={2}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
