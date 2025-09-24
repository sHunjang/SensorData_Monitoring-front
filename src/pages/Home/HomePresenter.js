import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * HomePresenter.tsx
 *
 * 목적:
 * - 홈 대시보드의 UI 구성. 4개의 카드 표시.
 * - 각 카드별로 에러/빈값을 안전하게 처리.
 */
import styles from './HomePresenter.module.css';
import Error from '@/components/common/Error';
export default function HomePresenter({ power, todayKwh, temperature, humidity, solar, powerError, todayError, envError, solarError, }) {
    const fmt = (v, digits = 2) => typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';
    return (_jsxs("div", { className: styles.grid, children: [_jsxs("div", { className: styles.card, children: [_jsx("h3", { children: "\uC2E4\uC2DC\uAC04 \uC804\uB825 (kW)" }), powerError ? _jsx(Error, { msg: powerError }) : _jsx("div", { className: styles.value, children: fmt(power) })] }), _jsxs("div", { className: styles.card, children: [_jsx("h3", { children: "\uB2F9\uC77C \uC804\uB825\uB7C9 (kWh)" }), todayError ? (_jsx(Error, { msg: todayError })) : (_jsx("div", { className: styles.value, children: todayKwh != null ? `${todayKwh.toFixed(2)} kWh` : '-' }))] }), _jsxs("div", { className: styles.card, children: [_jsx("h3", { children: "\uC628\uB3C4 / \uC2B5\uB3C4" }), envError ? (_jsx(Error, { msg: envError })) : (_jsxs("div", { className: styles.value, children: [temperature != null ? `${temperature} ℃` : '-', " / ", humidity != null ? `${humidity} %` : '-'] }))] }), _jsxs("div", { className: styles.card, children: [_jsx("h3", { children: "\uC77C\uC0AC\uB7C9 (W/m\u00B2)" }), solarError ? (_jsx(Error, { msg: solarError })) : (_jsx("div", { className: styles.value, children: solar != null ? `${solar} W/m²` : '-' }))] })] }));
}
