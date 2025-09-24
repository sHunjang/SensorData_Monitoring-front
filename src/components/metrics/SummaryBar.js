import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SummaryBar.tsx
 *
 * 목적:
 * - 대시보드 상단의 요약 카드 컴포넌트.
 * - 실시간/구간 평균을 모두 지원.
 *
 * props:
 * - title, unit, mode (realtime|range), realtimeValue, stats, seriesData(스파크라인)
 */
import styles from './SummaryBar.module.css';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
function fmt(n, d = 3) {
    if (n == null || Number.isNaN(n))
        return '—';
    const abs = Math.abs(n);
    const digits = abs >= 100 ? 1 : abs >= 10 ? 2 : d;
    return Number(n).toFixed(digits);
}
export default function SummaryBar({ title, unit, mode, realtimeValue, stats, windowText, seriesData, higherIsBetter = true, }) {
    const value = mode === 'realtime' ? realtimeValue : stats?.avg ?? null;
    let trendClass = styles.neutral;
    if (seriesData && seriesData.length >= 2) {
        const nums = seriesData.map((d) => d.y).filter((v) => v != null);
        if (nums.length >= 2) {
            const diff = nums[nums.length - 1] - nums[0];
            const good = higherIsBetter ? diff > 0 : diff < 0;
            const bad = higherIsBetter ? diff < 0 : diff > 0;
            trendClass = good ? styles.good : bad ? styles.bad : styles.neutral;
        }
    }
    return (_jsxs("div", { className: styles.card, children: [seriesData && seriesData.length > 1 && (_jsx("div", { className: styles.spark, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsx(LineChart, { data: seriesData, children: _jsx(Line, { type: "monotone", dataKey: "y", dot: false, strokeWidth: 2, isAnimationActive: false }) }) }) })), _jsxs("div", { className: styles.body, children: [_jsxs("div", { className: styles.title, children: [_jsx("span", { children: title }), unit ? _jsx("span", { className: styles.badge, children: unit }) : null] }), _jsxs("div", { className: `${styles.value} ${trendClass}`.trim(), children: [fmt(value), unit ? _jsx("span", { className: styles.unit, children: unit }) : null] }), mode === 'range' && stats && (_jsxs("div", { className: styles.rows, children: [_jsxs("div", { className: styles.kv, children: ["\uD3C9\uADE0 ", fmt(stats.avg)] }), _jsxs("div", { className: styles.kv, children: ["\uCD5C\uACE0 ", fmt(stats.max)] }), _jsxs("div", { className: styles.kv, children: ["\uCD5C\uC800 ", fmt(stats.min)] }), _jsxs("div", { className: styles.kv, children: ["\uAC1C\uC218 ", stats.count ?? 0] })] }))] }), mode === 'range' && windowText && _jsx("div", { className: styles.footer, children: windowText })] }));
}
