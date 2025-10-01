import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Header.tsx
 *
 * 목적:
 * - 앱 상단의 고정 헤더.
 * - 프로젝트명 및 간단한 서브텍스트 표시.
 */
export default function Header() {
    return (_jsxs("header", { style: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }, children: [_jsx("h1", { style: { margin: 0, fontSize: 18 }, children: "Sensor Monitoring" }), _jsx("div", { style: { opacity: 0.6, fontSize: 12 }, children: "TAC4300 + Env + Solar" })] }));
}
