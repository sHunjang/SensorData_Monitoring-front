/**
 * 상단 네비게이션 탭
 * - React Router NavLink 사용
 * - 활성 탭 스타일 강조
 */
import { NavLink } from 'react-router-dom';

export default function Tabs() {
    const tabs = [
        { to: '/', label: '홈' },
        { to: '/modbus', label: '🔌전력' },
        { to: '/temp', label: '🌡️온도' },
        { to: '/humidity', label: '💧습도' },
        { to: '/solar', label: '☀️일사량' },
    ];

    return (
        <nav className="tabs">
            {tabs.map((t) => (
                <NavLink
                    key={t.to}
                    to={t.to}
                    end
                    className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
                >
                    {t.label}
                </NavLink>
            ))}
            <style>{`
        .tabs {
          display:flex;
          gap:12px;
          padding:8px 16px;
          background:#111827;
        }
        .tab {
          color:#d1d5db;
          text-decoration:none;
          padding:6px 12px;
          border-radius:6px;
          transition: background 0.2s;
        }
        .tab:hover {
          background:#374151;
        }
        .tab--active {
          background:#2563eb;
          color:white;
        }
      `}</style>
        </nav>
    );
}
