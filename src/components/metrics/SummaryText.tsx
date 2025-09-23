/**
 * SummaryText.tsx
 *
 * 목적:
 * - 카드형 텍스트 요약. 작은 글씨로 현재값/통계 표시.
 *
 * props:
 * - title, unit, mode(realtime|range), realtimeValue, stats, windowText
 */
type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
type Mode = 'realtime' | 'range';

function fmt(n: number | null | undefined, d = 3) {
    if (n == null || Number.isNaN(n)) return '—';
    const abs = Math.abs(n);
    const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : d;
    return Number(n).toFixed(digits);
}

export default function SummaryText(props: {
    title: string;
    unit?: string;
    mode: Mode;
    realtimeValue?: number | null;
    stats?: Stat;
    windowText?: string;
}) {
    const { title, unit, mode, realtimeValue, stats, windowText } = props;
    if (mode === 'realtime') {
        return (
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <strong>{title}</strong>{' '}
                <span>
                    현재값: <b>{fmt(realtimeValue)}</b>
                    {unit ? ` ${unit}` : ''}
                </span>
            </div>
        );
    }
    return (
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            <strong>{title}</strong>
            <div>
                평균: <b>{fmt(stats?.avg)}</b>
                {unit ? ` ${unit}` : ''} · 최고: <b>{fmt(stats?.max)}</b>
                {unit ? ` ${unit}` : ''} · 최저: <b>{fmt(stats?.min)}</b>
                {unit ? ` ${unit}` : ''} · 개수: <b>{stats?.count ?? 0}</b>
            </div>
            {windowText ? <div>구간: {windowText}</div> : null}
        </div>
    );
}
