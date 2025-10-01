import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
export default function ModbusPresenter({ deviceId, setDeviceId, deviceOptions, column, setColumn, zoomLevel, zoomLabel, onZoomIn, onZoomOut, canZoomIn, canZoomOut, onDataPointClick, onManualRefresh, data, stats, loading, error, logs, peakLimits, setPeakLimits, }) {
    // 🔄 로딩 및 에러 상태 처리
    if (loading)
        return _jsx(Loading, {});
    if (error)
        return _jsx(Error, { msg: error });
    // ============= 실시간 값 및 변화량 계산 =============
    const lastDataPoint = data?.length ? data[data.length - 1] : null;
    const currentValue = lastDataPoint?.[column] ?? 0;
    const previousValue = data?.length > 1 ? data[data.length - 2]?.[column] ?? 0 : 0;
    const valueChange = currentValue - previousValue;
    const changePercent = previousValue ? ((valueChange / previousValue) * 100).toFixed(2) : '0.00';
    // 🎯 현재 컬럼의 피크 임계값
    const currentPeakLimit = peakLimits[column];
    // 🏷️ 컬럼별 한글 라벨 정의
    const columnLabels = {
        active_power: '유효전력 (kW)',
        reactive_power: '무효전력 (kVAR)',
        apparent_power: '피상전력 (kVA)',
        voltage_ll: '선간전압 (V)',
        voltage_ln: '상전압 (V)',
        current: '전류 (A)',
        power_factor: '역률',
        active_energy: '유효전력량 (kWh)',
        reactive_energy: '무효전력량 (kVArh)',
        apparent_energy: '피상전력량 (kVAh)',
    };
    // 🏷️ 컬럼별 단위 정의
    const unitLabels = {
        active_power: 'kW',
        reactive_power: 'kVAR',
        apparent_power: 'kVA',
        voltage_ll: 'V',
        voltage_ln: 'V',
        current: 'A',
        power_factor: '',
        active_energy: 'kWh',
        reactive_energy: 'kVArh',
        apparent_energy: 'kVAh',
    };
    /**
     * 🎯 전력계 상태 판정 함수
     */
    const getPowerStatus = (value, columnType) => {
        switch (columnType) {
            case 'active_power':
                if (value >= 12)
                    return { text: '고부하', color: '#f6465d', icon: '🔥' };
                if (value >= 6)
                    return { text: '정상부하', color: '#f7931e', icon: '⚡' };
                if (value >= 2)
                    return { text: '저부하', color: '#0ecb81', icon: '💡' };
                return { text: '대기모드', color: '#848e9c', icon: '😴' };
            case 'voltage_ll':
            case 'voltage_ln':
                if (value >= 240)
                    return { text: '정상전압', color: '#0ecb81', icon: '✅' };
                if (value >= 200)
                    return { text: '저전압', color: '#f7931e', icon: '⚠️' };
                return { text: '이상전압', color: '#f6465d', icon: '🚨' };
            case 'current':
                if (value >= 60)
                    return { text: '고전류', color: '#f6465d', icon: '🔥' };
                if (value >= 30)
                    return { text: '정상전류', color: '#0ecb81', icon: '⚡' };
                return { text: '저전류', color: '#f7931e', icon: '💡' };
            default:
                return { text: '측정중', color: '#0ecb81', icon: '📊' };
        }
    };
    /**
     * 🚨 피크 임계값 업데이트 함수
     */
    const handlePeakLimitChange = (inputValue) => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue) && numericValue > 0) {
            setPeakLimits((prev) => ({
                ...prev,
                [column]: numericValue,
            }));
        }
    };
    /**
     * 🗑️ 피크 임계값 제거 함수
     */
    const handlePeakLimitRemove = () => {
        setPeakLimits((prev) => {
            const updated = { ...prev };
            delete updated[column];
            return updated;
        });
    };
    const powerStatus = getPowerStatus(currentValue, column);
    // ============= UI 렌더링 =============
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsxs("h1", { className: styles.title, children: ["\u26A1 PWR-", deviceId] }), _jsxs("div", { className: styles.subtitle, children: ["\uC804\uB825 \uBAA8\uB2C8\uD130\uB9C1 \u2022 ", zoomLabel, " \uBC94\uC704"] })] }), _jsxs("div", { className: styles.priceInfo, children: [_jsxs("h2", { className: styles.currentPrice, children: [currentValue.toFixed(3), " ", unitLabels[column]] }), _jsxs("div", { className: `${styles.priceChange} ${valueChange < 0 ? styles.priceChangeNegative : ''}`, children: [_jsx("span", { children: valueChange >= 0 ? '📈' : '📉' }), _jsxs("span", { children: [changePercent, "%"] }), _jsxs("span", { children: ["(", valueChange >= 0 ? '+' : '', valueChange.toFixed(3), ")"] })] })] })] }), _jsx("div", { className: styles.controls, children: _jsxs("div", { className: styles.controlsGrid, children: [_jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uC804\uB825 \uC7A5\uCE58" }), _jsx("select", { value: deviceId, onChange: (e) => setDeviceId(Number(e.target.value)), children: deviceOptions.map((id) => (_jsxs("option", { value: id, children: ["\uC7A5\uCE58 ", id] }, id))) })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uCE21\uC815 \uD56D\uBAA9" }), _jsxs("select", { value: column, onChange: (e) => setColumn(e.target.value), children: [_jsxs("optgroup", { label: "\uD83D\uDD0C \uC804\uB825", children: [_jsx("option", { value: "active_power", children: "\uC720\uD6A8\uC804\uB825 (kW)" }), _jsx("option", { value: "reactive_power", children: "\uBB34\uD6A8\uC804\uB825 (kVAR)" }), _jsx("option", { value: "apparent_power", children: "\uD53C\uC0C1\uC804\uB825 (kVA)" })] }), _jsxs("optgroup", { label: "\u26A1 \uC804\uC555", children: [_jsx("option", { value: "voltage_ll", children: "\uC120\uAC04\uC804\uC555 (V)" }), _jsx("option", { value: "voltage_ln", children: "\uC0C1\uC804\uC555 (V)" })] }), _jsxs("optgroup", { label: "\uD83D\uDD0B \uC804\uB958 & \uC5ED\uB960", children: [_jsx("option", { value: "current", children: "\uC804\uB958 (A)" }), _jsx("option", { value: "power_factor", children: "\uC5ED\uB960" })] }), _jsxs("optgroup", { label: "\uD83D\uDCC8 \uC804\uB825\uB7C9", children: [_jsx("option", { value: "active_energy", children: "\uC720\uD6A8\uC804\uB825\uB7C9 (kWh)" }), _jsx("option", { value: "reactive_energy", children: "\uBB34\uD6A8\uC804\uB825\uB7C9 (kVArh)" }), _jsx("option", { value: "apparent_energy", children: "\uD53C\uC0C1\uC804\uB825\uB7C9 (kVAh)" })] })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD83D\uDD0D \uC2DC\uAC04 \uBC94\uC704" }), _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx("button", { onClick: onZoomIn, disabled: !canZoomIn, style: {
                                                    flex: 1,
                                                    opacity: canZoomIn ? 1 : 0.5,
                                                    cursor: canZoomIn ? 'pointer' : 'not-allowed',
                                                    padding: '6px 8px',
                                                    fontSize: '11px',
                                                }, title: canZoomIn ? '더 세부적인 시간으로 확대' : '최대 확대됨', children: "\uD83D\uDD0D+ \uD655\uB300" }), _jsx("button", { onClick: onZoomOut, disabled: !canZoomOut, style: {
                                                    flex: 1,
                                                    opacity: canZoomOut ? 1 : 0.5,
                                                    cursor: canZoomOut ? 'pointer' : 'not-allowed',
                                                    padding: '6px 8px',
                                                    fontSize: '11px',
                                                }, title: canZoomOut ? '더 넓은 시간으로 축소' : '최대 축소됨', children: "\uD83D\uDD0D- \uCD95\uC18C" })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD83D\uDCCA \uD604\uC7AC \uBCF4\uAE30" }), _jsxs("div", { style: {
                                            padding: '8px 12px',
                                            background: '#2b2f36',
                                            border: `2px solid ${zoomLevel <= 1 ? '#0ecb81' : '#f7931e'}`,
                                            borderRadius: '4px',
                                            color: zoomLevel <= 1 ? '#0ecb81' : '#f7931e',
                                            fontSize: '12px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }, children: [zoomLevel <= 1 && _jsx("span", { children: "\uD83D\uDD34" }), "\uD83D\uDCC5 ", zoomLabel, zoomLevel <= 1 && _jsx("span", { children: "(\uC2E4\uC2DC\uAC04)" })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsxs("label", { children: ["\uD83D\uDEA8 \uC54C\uB9BC \uC784\uACC4\uAC12 (", unitLabels[column], ")"] }), _jsx("input", { type: "number", step: "0.1", value: currentPeakLimit || '', onChange: (e) => handlePeakLimitChange(e.target.value), placeholder: "\uC784\uACC4\uAC12 \uC785\uB825", style: {
                                            background: '#2b2f36',
                                            border: '1px solid #2e3238',
                                            color: '#f7f8fa',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                        } })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\u00A0" }), _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx("button", { onClick: onManualRefresh, style: { flex: 1, fontSize: '11px' }, children: "\uD83D\uDD04 \uC0C8\uB85C\uACE0\uCE68" }), currentPeakLimit && (_jsx("button", { onClick: handlePeakLimitRemove, style: {
                                                    flex: 1,
                                                    background: '#f6465d',
                                                    borderColor: '#f6465d',
                                                    fontSize: '11px',
                                                }, children: "\uD83D\uDDD1\uFE0F \uC81C\uAC70" }))] })] })] }) }), _jsxs("div", { className: styles.chartSection, children: [_jsxs("div", { className: styles.chartToolbar, children: [_jsxs("div", { className: styles.chartTitle, children: ["\u26A1 ", columnLabels[column], " \uBD84\uC11D \uCC28\uD2B8"] }), _jsxs("div", { className: styles.chartControls, children: [_jsxs("span", { style: { fontSize: '11px', color: powerStatus.color, fontWeight: '600' }, children: [powerStatus.icon, " ", powerStatus.text, " \u2022 ", data.length, "\uAC1C \uB370\uC774\uD130"] }), currentPeakLimit && (_jsxs("span", { style: { fontSize: '11px', color: '#f6465d', fontWeight: '600' }, children: ["\u2022 \uD83D\uDEA8 \uC784\uACC4\uAC12: ", currentPeakLimit, " ", unitLabels[column]] })), _jsxs("span", { style: { fontSize: '11px', color: '#f7931e', fontWeight: '600' }, children: ["\u2022 \uD83D\uDCCA \uBC94\uC704: ", zoomLabel] }), zoomLevel >= 2 && (_jsx("span", { style: { fontSize: '11px', color: '#26a69a', fontWeight: '600' }, children: "\u2022 \uD83D\uDDB1\uFE0F \uD074\uB9AD\uC73C\uB85C \uB4DC\uB9B4\uB2E4\uC6B4 \uAC00\uB2A5" }))] })] }), _jsx("div", { style: { height: 'calc(100% - 60px)' }, children: _jsx(LineChartWrapper, { data: data, keys: [column], labels: columnLabels, xKey: "bucket", zoomLevel: zoomLevel, peakLimit: currentPeakLimit, peakLimitLabel: `${columnLabels[column]} 임계값: ${currentPeakLimit || 0}`, onDataPointClick: onDataPointClick, csvExport: {
                                    apiPath: '/data/modbus/query',
                                    extraParams: { device_id: deviceId },
                                    filePrefix: `전력데이터-장치${deviceId}-${zoomLabel}`,
                                } }) })] }), _jsxs("div", { className: styles.statsGrid, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uD604\uC7AC\uAC12" }), _jsx("div", { className: styles.statValue, children: currentValue.toFixed(3) }), _jsxs("div", { className: `${styles.statChange} ${valueChange < 0 ? styles.statChangeNegative : ''}`, children: [valueChange >= 0 ? '+' : '', valueChange.toFixed(3), " ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uD3C9\uADE0 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.avg?.toFixed(3) || '0.000' }), _jsxs("div", { className: styles.statChange, children: ["\uD3C9\uADE0 ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uACE0\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.max?.toFixed(3) || '0.000' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uACE0\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uC800\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.min?.toFixed(3) || '0.000' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uC800\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uCE21\uC815 \uD69F\uC218" }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.count || '0' }), _jsx("div", { className: styles.statChange, children: "\uD68C" })] }), currentPeakLimit && (_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uC784\uACC4\uAC12 \uC0C1\uD0DC" }), _jsx("div", { className: styles.statValue, style: {
                                        color: currentValue > currentPeakLimit ? '#f6465d' : '#0ecb81',
                                    }, children: currentValue > currentPeakLimit ? '⚠️' : '✅' }), _jsx("div", { className: styles.statChange, children: currentValue > currentPeakLimit ? '임계값 초과' : '정상 범위' })] }))] }), _jsxs("div", { className: styles.logPanel, children: [_jsx("div", { className: styles.logHeader, children: "\u26A1 \uC804\uB825 \uC2DC\uC2A4\uD15C \uD65C\uB3D9 \uB85C\uADF8" }), logs.slice(-20).map((logEntry, index) => (_jsx("div", { className: styles.logItem, children: logEntry }, index))), logs.length === 0 && _jsx("div", { className: styles.logItem, children: "\uCD5C\uADFC \uD65C\uB3D9 \uC5C6\uC74C" })] })] }) }));
}
