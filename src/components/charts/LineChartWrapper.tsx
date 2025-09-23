/**
 * LineChartWrapper.tsx
 *
 * 목적:
 * - Recharts 기반 범용 라인 차트 래퍼.
 * - 서버에서 받은 시계열 데이터를 안전하게 렌더링.
 *
 * 동작 요약:
 * - data: { bucket: string|number|Date, <series keys>: number|null, ... }[]
 * - keys: 렌더링할 시리즈 키 목록.
 * - labels: 시리즈 레이블 매핑.
 * - xKey: X축 필드명 (기본 'bucket').
 * - X축 값은 Date로 파싱 가능하면 HH:MM 형태로 표시. 실패 시 원값 문자열로 표시.
 *
 * 주의:
 * - 서버와 클라이언트의 타임존 불일치가 있으면 시간 표시가 어긋남.
 * - 시간 문제를 완전히 해결하려면 서버에서 tz-aware ISO(예: 2025-09-23T12:00:00+09:00)를 보내도록 하거나
 *   클라이언트에서 명시적으로 UTC→KST 변환 로직을 적용해야 함.
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

type Props = {
    data: any[];
    keys: string[];
    labels: Record<string, string>;
    xKey?: string;
};

function fmt(ts?: string | number | Date) {
    if (ts == null) return '';
    const d = ts instanceof Date ? ts : new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    // KST로 고정 포맷
    return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul',
        hour12: false,
    }).format(d);
}

export default function LineChartWrapper({ data, keys, labels, xKey = 'bucket' }: Props) {
    if (!data?.length)
        return <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#888' }}>데이터 없음</div>;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey={xKey}
                    type="number"
                    domain={['auto', 'auto']}
                    scale="time"
                    tickFormatter={(ts) => {
                        if (!ts) return '';
                        const d = new Date(Number(ts));
                        return new Intl.DateTimeFormat('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Seoul',
                            hour12: false,
                        }).format(d);
                    }}
                    minTickGap={24}
                />
                <YAxis allowDecimals />
                <Tooltip
                    labelFormatter={(v) => {
                        if (!v) return '';
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
