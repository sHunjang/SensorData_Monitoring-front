/**
 * LineChartWrapper.tsx
 * - 버튼 기반 줌(+/−)
 * - 클릭/터치로 툴팁 고정
 * - labels.ts 매핑으로 일반인 친화적 라벨 표시
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

type RawPoint = { bucket: string } & Record<string, number | null>;
type SeriesRow = { bucket: string; ts: number } & Record<string, number | null>;

type Props = {
    data: RawPoint[];
    keys: string[];
    labels: Record<string, string>;
};

export default function LineChartWrapper({ data, keys, labels }: Props) {
    const dataTS: SeriesRow[] = useMemo(
        () =>
            data.map((d) => ({
                ...d,
                ts: new Date(d.bucket).getTime(),
            })) as SeriesRow[],
        [data]
    );

    const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const inRange = activeIndex != null && activeIndex >= 0 && activeIndex < dataTS.length;
    const fixed = inRange ? dataTS[activeIndex!] : null;

    // 줌 in/out
    const handleZoom = (dir: 'in' | 'out') => {
        if (!dataTS.length) return;
        const min = dataTS[0].ts;
        const max = dataTS[dataTS.length - 1].ts;
        const range = Math.max(1, max - min);
        const factor = dir === 'in' ? 0.5 : 2;
        const newRange = Math.max(1000, range * factor);
        const center = (min + max) / 2;
        setZoomDomain([center - newRange / 2, center + newRange / 2]);
    };
    const resetZoom = () => setZoomDomain(null);

    // 클릭/터치 → 툴팁 고정
    const handleClick = (e: any) => {
        const idx = e?.activeTooltipIndex;
        if (typeof idx === 'number') setActiveIndex(idx);
        else setActiveIndex(null);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* 줌 컨트롤 */}
            <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                <button onClick={() => handleZoom('in')}>＋ 확대</button>
                <button onClick={() => handleZoom('out')}>－ 축소</button>
                <button onClick={resetZoom}>원래대로</button>
                {inRange && <button onClick={() => setActiveIndex(null)}>툴팁 해제</button>}
            </div>

            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={dataTS} onClick={handleClick}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="ts"
                        type="number"
                        scale="time"
                        domain={zoomDomain ?? ['auto', 'auto']}
                        tickFormatter={(ts) => new Date(ts as number).toLocaleString('ko-KR', { hour12: false })}
                    />
                    <YAxis />
                    {/* 기본 hover 툴팁 */}
                    <Tooltip
                        labelFormatter={(ts) => new Date(ts as number).toLocaleString('ko-KR', { hour12: false })}
                    />
                    {keys.map((k, i) => (
                        <Line
                            key={k}
                            type="monotone"
                            dataKey={k}
                            name={labels[k] ?? k}
                            stroke={['#2563eb', '#dc2626', '#16a34a', '#f59e0b'][i % 4]}
                            dot={false}
                            isAnimationActive={false}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* 고정 툴팁 */}
            {fixed && (
                <div
                    style={{
                        position: 'absolute',
                        right: 8,
                        top: 44,
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        pointerEvents: 'none',
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {new Date(fixed.ts).toLocaleString('ko-KR', { hour12: false })}
                    </div>
                    {keys.map((k) => (
                        <div key={k} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <span>{labels[k] ?? k}</span>
                            <span>{fixed[k] ?? '-'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
