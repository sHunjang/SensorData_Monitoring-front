import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './HomePresenter.module.css';
import Error from '@/components/common/Error';
/**
 * 🎨 HomePresenter 메인 컴포넌트 - 완전한 트레이딩 스타일
 */
export default function HomePresenter({ power, todayKwh, temperature, humidity, solar, powerError, todayError, envError, solarError, }) {
    /**
     * 🔢 숫자 포맷팅 헬퍼 함수
     */
    const fmt = (v, digits = 2) => {
        return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';
    };
    /**
     * 🎯 전력 상태 판정 함수
     */
    const getPowerStatus = (power) => {
        if (!power)
            return { color: '#848e9c', icon: '🔌', status: '대기' };
        if (power >= 15)
            return { color: '#f6465d', icon: '⚡', status: '고부하' };
        if (power >= 8)
            return { color: '#f7931e', icon: '🔋', status: '정상' };
        if (power >= 3)
            return { color: '#0ecb81', icon: '💡', status: '저부하' };
        return { color: '#848e9c', icon: '⏸️', status: '미미' };
    };
    /**
     * 🌡️ 환경 상태 판정 함수
     */
    const getEnvStatus = (temp, hum) => {
        if (!temp || !hum)
            return { color: '#848e9c', icon: '🌡️', status: '측정 중' };
        if (temp >= 25 && temp <= 28 && hum >= 40 && hum <= 60) {
            return { color: '#0ecb81', icon: '🌿', status: '최적' };
        }
        if (temp >= 30 || hum >= 70)
            return { color: '#f6465d', icon: '🔥', status: '주의' };
        if (temp <= 18 || hum <= 30)
            return { color: '#17a2b8', icon: '❄️', status: '건조' };
        return { color: '#f7931e', icon: '⚠️', status: '보통' };
    };
    /**
     * ☀️ 태양광 상태 판정 함수
     */
    const getSolarStatus = (solar) => {
        if (!solar)
            return { color: '#848e9c', icon: '🌡️', status: '측정 중' };
        if (solar >= 800)
            return { color: '#0ecb81', icon: '☀️', status: '매우 좋음' };
        if (solar >= 500)
            return { color: '#f7931e', icon: '🌤️', status: '좋음' };
        if (solar >= 200)
            return { color: '#17a2b8', icon: '⛅', status: '보통' };
        return { color: '#f6465d', icon: '☁️', status: '낮음' };
    };
    const powerStatus = getPowerStatus(power);
    const envStatus = getEnvStatus(temperature, humidity);
    const solarStatus = getSolarStatus(solar);
    // ============= UI 렌더링 (트레이딩 스타일) =============
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsx("h1", { className: styles.title, children: "\uD83D\uDCCA SYSTEM DASHBOARD" }), _jsx("div", { className: styles.subtitle, children: "Real-time Monitoring \u2022 Live Data" })] }), _jsxs("div", { className: styles.priceInfo, children: [_jsxs("h2", { className: styles.currentPrice, children: [fmt(power, 2), " kW"] }), _jsxs("div", { className: `${styles.priceChange}`, style: { color: powerStatus.color }, children: [_jsx("span", { children: powerStatus.icon }), _jsx("span", { children: powerStatus.status })] })] })] }), _jsxs("div", { className: styles.dashboardGrid, children: [_jsxs("div", { className: `${styles.card} ${styles.powerCard}`, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("div", { className: styles.cardIcon, children: "\u26A1" }), _jsx("div", { className: styles.cardTitle, children: "\uC2E4\uC2DC\uAC04 \uC804\uB825" }), _jsxs("div", { className: styles.cardStatus, style: { color: powerStatus.color }, children: [powerStatus.icon, " ", powerStatus.status] })] }), powerError ? (_jsx(Error, { msg: powerError })) : (_jsxs("div", { className: styles.cardContent, children: [_jsx("div", { className: styles.cardValue, style: { color: powerStatus.color }, children: fmt(power, 2) }), _jsx("div", { className: styles.cardUnit, children: "kW" })] }))] }), _jsxs("div", { className: `${styles.card} ${styles.energyCard}`, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("div", { className: styles.cardIcon, children: "\uD83D\uDCC8" }), _jsx("div", { className: styles.cardTitle, children: "\uC624\uB298 \uC804\uB825\uB7C9" }), _jsx("div", { className: styles.cardStatus, children: "\uD83D\uDCCA \uB204\uC801\uAC12" })] }), todayError ? (_jsx(Error, { msg: todayError })) : (_jsxs("div", { className: styles.cardContent, children: [_jsx("div", { className: styles.cardValue, style: { color: '#0ecb81' }, children: fmt(todayKwh, 2) }), _jsx("div", { className: styles.cardUnit, children: "kWh" })] }))] }), _jsxs("div", { className: `${styles.card} ${styles.envCard}`, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("div", { className: styles.cardIcon, children: "\uD83C\uDF21\uFE0F" }), _jsx("div", { className: styles.cardTitle, children: "\uD658\uACBD \uC13C\uC11C" }), _jsxs("div", { className: styles.cardStatus, style: { color: envStatus.color }, children: [envStatus.icon, " ", envStatus.status] })] }), envError ? (_jsx(Error, { msg: envError })) : (_jsx("div", { className: styles.cardContent, children: _jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'baseline' }, children: [_jsxs("div", { children: [_jsx("div", { className: styles.cardValue, style: { color: envStatus.color, fontSize: '50px' }, children: fmt(temperature, 1) }), _jsx("div", { className: styles.cardUnit, children: "\u00B0C" })] }), _jsxs("div", { children: [_jsx("div", { className: styles.cardValue, style: { color: envStatus.color, fontSize: '50px' }, children: fmt(humidity, 1) }), _jsx("div", { className: styles.cardUnit, children: "%" })] })] }) }))] }), _jsxs("div", { className: `${styles.card} ${styles.solarCard}`, children: [_jsxs("div", { className: styles.cardHeader, children: [_jsx("div", { className: styles.cardIcon, children: "\u2600\uFE0F" }), _jsx("div", { className: styles.cardTitle, children: "\uD0DC\uC591\uAD11 \uC77C\uC0AC\uB7C9" }), _jsxs("div", { className: styles.cardStatus, style: { color: solarStatus.color }, children: [solarStatus.icon, " ", solarStatus.status] })] }), solarError ? (_jsx(Error, { msg: solarError })) : (_jsxs("div", { className: styles.cardContent, children: [_jsx("div", { className: styles.cardValue, style: { color: solarStatus.color }, children: fmt(solar, 0) }), _jsx("div", { className: styles.cardUnit, children: "W/m\u00B2" })] }))] })] }), _jsxs("div", { className: styles.statusBar, children: [_jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusDot, style: { background: powerStatus.color } }), _jsxs("span", { children: ["\uC804\uB825 \uC2DC\uC2A4\uD15C: ", powerStatus.status] })] }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusDot, style: { background: envStatus.color } }), _jsxs("span", { children: ["\uD658\uACBD \uC2DC\uC2A4\uD15C: ", envStatus.status] })] }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusDot, style: { background: solarStatus.color } }), _jsxs("span", { children: ["\uD0DC\uC591\uAD11 \uC2DC\uC2A4\uD15C: ", solarStatus.status] })] }), _jsxs("div", { className: styles.statusItem, children: [_jsx("span", { className: styles.statusDot, style: { background: '#0ecb81' } }), _jsx("span", { children: "\uC2DC\uC2A4\uD15C \uC5F0\uACB0: \uC815\uC0C1" })] })] })] }) }));
}
