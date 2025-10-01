import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * DeviceCard.tsx
 *
 * 목적:
 * - 홈 대시보드에서 장치의 실시간 요약을 카드로 표시.
 *
 * props:
 * - title: 카드 제목
 * - phase: '3P3W' | '3P4W' (상태/설정 표시)
 * - kw: 실시간 전력(kW) 또는 null
 * - todayKwh: 당일 누적 전력(kWh) 또는 null
 * - error: 오류 메시지 있으면 ERR로 표시
 *
 * 동작:
 * - 값이 없거나 오류면 '-' 또는 'ERR' 로 안전 표시.
 * - UI는 단순 텍스트 기반. 필요시 스타일 확장.
 */
export default function DeviceCard({ title, phase, kW, todaykWh, error, }) {
    const fmt = (v, digits = 2) => typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';
    return (_jsxs("div", { className: "card", style: { padding: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("div", { style: { fontWeight: 700 }, children: title }), _jsx("span", { title: error ? error : phase, style: {
                            fontSize: 12,
                            background: error ? '#fff1f2' : '#eef2ff',
                            border: `1px solid ${error ? '#fecaca' : '#c7d2fe'}`,
                            color: error ? '#b91c1c' : '#3730a3',
                            padding: '2px 6px',
                            borderRadius: 6,
                        }, children: error ? 'ERR' : phase })] }), _jsxs("div", { style: { fontSize: 28, lineHeight: 1.2 }, children: [error ? _jsx("span", { style: { color: '#b91c1c' }, children: "ERR" }) : fmt(kW), ' ', _jsx("span", { style: { fontSize: 14 }, children: "kW" })] }), _jsxs("div", { style: { opacity: 0.7, fontSize: 12, marginTop: 8 }, children: ["\uAE08\uC77C \uB204\uC801: ", fmt(todaykWh, 2), " kWh"] })] }));
}
