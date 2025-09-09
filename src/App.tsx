// src/App.tsx
/**
 * 라우팅 엔트리.
 * - 홈, 전력(Modbus), 온·습도(Env), 일사량(Solar)
 */
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomeContainer from './pages/Home/HomeContainer';
import ModbusContainer from './pages/Modbus/ModebusContainer';
import EnvContainer from './pages/Env/EnvContainer';
import SolarContainer from './pages/Solar/SolarContainer';

export default function App() {
    const Tab = ({ to, label }: { to: string; label: string }) => (
        <NavLink to={to} end className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}>
            {label}
        </NavLink>
    );
    return (
        <BrowserRouter>
            <nav className="tabs">
                <Tab to="/" label="홈" />
                <Tab to="/modbus" label="전력" />
                <Tab to="/env" label="온·습도" />
                <Tab to="/solar" label="일사량" />
            </nav>
            <Routes>
                <Route path="/" element={<HomeContainer />} />
                <Route path="/modbus" element={<ModbusContainer />} />
                <Route path="/env" element={<EnvContainer />} />
                <Route path="/solar" element={<SolarContainer />} />
            </Routes>
            <style>{`
        .tabs{display:flex;gap:12px;padding:8px 16px;background:#111827}
        .tab{color:#d1d5db;text-decoration:none;padding:6px 12px;border-radius:6px}
        .tab--active{background:#2563eb;color:#fff}
      `}</style>
        </BrowserRouter>
    );
}
