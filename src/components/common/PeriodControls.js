import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PeriodControls.tsx
 *
 * 목적:
 * - 시간 범위 선택(프리셋)과 모드(realtime/range) 선택 UI 제공
 *
 * props:
 * - mode, setMode, preset, setPreset, onQuery, loading
 *
 * 주의:
 * - 프리셋 값은 백엔드와 완전 일치해야 함 (예: '15m','1h','1d','1w','1mo')
 */
import styles from './PeriodControls.module.css';
export default function PeriodControls(props) {
    const { mode, setMode, preset, setPreset, onQuery, loading } = props;
    return (_jsxs("div", { className: styles.controls, children: [_jsxs("label", { className: styles.row, children: ["\uBAA8\uB4DC", _jsxs("select", { value: mode, onChange: (e) => setMode(e.target.value), className: styles.input, children: [_jsx("option", { value: "realtime", children: "\uC2E4\uC2DC\uAC04" }), _jsx("option", { value: "range", children: "\uAE30\uAC04" })] })] }), mode === 'range' && (_jsxs("label", { className: styles.row, children: ["\uAE30\uAC04", _jsxs("select", { value: preset, onChange: (e) => setPreset(e.target.value), className: styles.input, children: [_jsx("option", { value: "15m", children: "15\uBD84" }), _jsx("option", { value: "1h", children: "1\uC2DC\uAC04" }), _jsx("option", { value: "1d", children: "1\uC77C" }), _jsx("option", { value: "1w", children: "1\uC8FC" }), _jsx("option", { value: "1mo", children: "1\uAC1C\uC6D4" })] })] })), _jsx("button", { onClick: onQuery, className: styles.button, children: mode === 'realtime' ? '즉시 새로고침' : '기간 조회' })] }));
}
