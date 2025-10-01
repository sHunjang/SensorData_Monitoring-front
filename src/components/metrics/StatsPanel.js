import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * StatsPanel.tsx
 *
 * 목적:
 * - 통계 객체(평균/최대/최소/개수)를 여럿 렌더링.
 *
 * props:
 * - title: string
 * - stats: Record<string, {avg,max,min,count}>
 *
 * 동작:
 * - stats가 비어있으면 '데이터 없음' 표시.
 */
import styles from './StatsPanel.module.css';
const fmt = (n, d = 2) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d) : '—');
export default function StatsPanel({ title, stats }) {
    const entries = Object.entries(stats ?? {});
    return (_jsxs("section", { children: [_jsx("h4", { style: { margin: '0 0 8px 0' }, children: title }), entries.length === 0 ? (_jsx("p", { children: "\uB370\uC774\uD130 \uC5C6\uC74C" })) : (_jsx("div", { className: styles.grid, children: entries.map(([k, s]) => (_jsxs("div", { className: styles.item, children: [_jsx("div", { className: styles.label, children: k }), _jsxs("div", { className: styles.values, children: [_jsxs("div", { children: ["\uD3C9\uADE0: ", fmt(s?.avg)] }), _jsxs("div", { children: ["\uCD5C\uACE0: ", fmt(s?.max)] }), _jsxs("div", { children: ["\uCD5C\uC800: ", fmt(s?.min)] }), _jsxs("div", { children: ["\uAC1C\uC218: ", s?.count ?? 0] })] })] }, k))) }))] }));
}
