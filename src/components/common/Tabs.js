import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Tabs.tsx
 *
 * 목적:
 * - 라우팅 탭 네비게이션.
 * - react-router-dom의 NavLink를 사용하여 활성 탭 스타일링.
 */
import { NavLink } from 'react-router-dom';
export default function Tabs() {
    const tabs = [
        { to: '/', label: '홈' },
        { to: '/modbus', label: '전력' },
        { to: '/env', label: '온·습도' },
        { to: '/solar', label: '일사량' },
    ];
    return (_jsx("nav", { className: "tabs", style: { display: 'flex', gap: 12 }, children: tabs.map((t) => (_jsx(NavLink, { to: t.to, end: true, style: ({ isActive }) => ({
                padding: '6px 10px',
                borderRadius: 8,
                background: isActive ? '#eef2ff' : 'transparent',
            }), children: t.label }, t.to))) }));
}
