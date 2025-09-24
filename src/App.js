import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/App.tsx
/**
 * 라우팅 엔트리.
 * - 홈, 전력(Modbus), 온·습도(Env), 일사량(Solar)
 */
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomeContainer from './pages/Home/HomeContainer';
import ModbusContainer from './pages/Modbus/ModbusContainer';
import EnvContainer from './pages/Env/EnvContainer';
import SolarContainer from './pages/Solar/SolarContainer';
export default function App() {
    const Tab = ({ to, label }) => (_jsx(NavLink, { to: to, end: true, className: ({ isActive }) => 'tab' + (isActive ? ' tab--active' : ''), children: label }));
    return (_jsxs(BrowserRouter, { children: [_jsxs("nav", { className: "tabs", children: [_jsx(Tab, { to: "/", label: "\uD648" }), _jsx(Tab, { to: "/modbus", label: "\uC804\uB825" }), _jsx(Tab, { to: "/env", label: "\uC628\u00B7\uC2B5\uB3C4" }), _jsx(Tab, { to: "/solar", label: "\uC77C\uC0AC\uB7C9" })] }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomeContainer, {}) }), _jsx(Route, { path: "/modbus", element: _jsx(ModbusContainer, {}) }), _jsx(Route, { path: "/env", element: _jsx(EnvContainer, {}) }), _jsx(Route, { path: "/solar", element: _jsx(SolarContainer, {}) })] }), _jsx("style", { children: `
        .tabs{display:flex;gap:12px;padding:8px 16px;background:#111827}
        .tab{color:#d1d5db;text-decoration:none;padding:6px 12px;border-radius:6px}
        .tab--active{background:#2563eb;color:#fff}
      ` })] }));
}
