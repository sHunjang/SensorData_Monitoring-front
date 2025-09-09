// src/components/common/Tabs.tsx
/** 상단 탭 네비게이션. 반응형 간격. */
import { NavLink } from 'react-router-dom';
export default function Tabs() {
    const tabs = [
        { to: '/', label: '홈' },
        { to: '/modbus', label: '전력' },
        { to: '/env', label: '온·습도' },
        { to: '/solar', label: '일사량' },
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
        </nav>
    );
}
