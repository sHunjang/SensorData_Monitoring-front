import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
export default function SolarPresenter({ deviceId, setDeviceId, deviceOptions, column, setColumn, zoomLevel, zoomLabel, onZoomIn, onZoomOut, canZoomIn, canZoomOut, onDataPointClick, onManualRefresh, data, stats, loading, error, logs, peakLimits, setPeakLimits, }) {
    // 🔄 로딩 및 에러 상태 처리
    if (loading)
        return _jsx(Loading, {});
    if (error)
        return _jsx(Error, { msg: error });
    // ============= 태양광센서 실시간 값 및 변화량 계산 =============
    const lastDataPoint = data?.length ? data[data.length - 1] : null;
    const currentValue = lastDataPoint?.[column] ?? 0;
    const previousValue = data?.length > 1 ? data[data.length - 2]?.[column] ?? 0 : 0;
    const valueChange = currentValue - previousValue;
    const changePercent = previousValue ? ((valueChange / previousValue) * 100).toFixed(2) : '0.00';
    // 🎯 현재 컬럼의 태양광 임계값
    const currentPeakLimit = peakLimits[column];
    // 🏷️ 태양광센서 컬럼별 한글 라벨 정의
    const columnLabels = {
        solar: '일사량 (W/m²)',
    };
    // 🏷️ 태양광센서 컬럼별 단위 정의
    const unitLabels = {
        solar: 'W/m²',
    };
    /**
     * ☀️ 태양광센서 상태 판정 함수
     */
    const getSolarStatus = (value, columnType) => {
        switch (columnType) {
            case 'solar':
                if (value >= 1000)
                    return { text: '강한일사', color: '#f7931e', icon: '☀️' };
                if (value >= 800)
                    return { text: '보통일사', color: '#0ecb81', icon: '🌤️' };
                if (value >= 400)
                    return { text: '약한일사', color: '#26a69a', icon: '⛅' };
                if (value >= 100)
                    return { text: '흐림', color: '#848e9c', icon: '☁️' };
                return { text: '야간/차단', color: '#2e3238', icon: '🌙' };
            default:
                return { text: '측정중', color: '#0ecb81', icon: '📊' };
        }
    };
    /**
     * 🚨 태양광 임계값 업데이트 함수
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
     * 🗑️ 태양광 임계값 제거 함수
     */
    const handlePeakLimitRemove = () => {
        setPeakLimits((prev) => {
            const updated = { ...prev };
            delete updated[column];
            return updated;
        });
    };
    const solarStatus = getSolarStatus(currentValue, column);
    // ============= 태양광센서 UI 렌더링 =============
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsxs("h1", { className: styles.title, children: ["\u2600\uFE0F SOL-", deviceId] }), _jsxs("div", { className: styles.subtitle, children: ["\uD0DC\uC591\uAD11 \uBAA8\uB2C8\uD130\uB9C1 \u2022 ", zoomLabel, " \uBC94\uC704"] })] }), _jsxs("div", { className: styles.priceInfo, children: [_jsxs("h2", { className: styles.currentPrice, children: [currentValue.toFixed(0), " ", unitLabels[column]] }), _jsxs("div", { className: `${styles.priceChange} ${valueChange < 0 ? styles.priceChangeNegative : ''}`, children: [_jsx("span", { children: valueChange >= 0 ? '📈' : '📉' }), _jsxs("span", { children: [changePercent, "%"] }), _jsxs("span", { children: ["(", valueChange >= 0 ? '+' : '', valueChange.toFixed(0), ")"] })] })] })] }), _jsx("div", { className: styles.controls, children: _jsxs("div", { className: styles.controlsGrid, children: [_jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD0DC\uC591\uAD11\uC13C\uC11C" }), _jsx("select", { value: deviceId, onChange: (e) => setDeviceId(Number(e.target.value)), children: deviceOptions.map((id) => (_jsxs("option", { value: id, children: ["\uD0DC\uC591\uAD11 ", id] }, id))) })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uCE21\uC815 \uD56D\uBAA9" }), _jsx("select", { value: column, onChange: (e) => setColumn(e.target.value), children: _jsx("option", { value: "solar", children: "\u2600\uFE0F \uC77C\uC0AC\uB7C9 (W/m\u00B2)" }) })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD83D\uDD0D \uC2DC\uAC04 \uBC94\uC704" }), _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx("button", { onClick: onZoomIn, disabled: !canZoomIn, style: {
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
                                            border: `2px solid ${zoomLevel <= 1 ? '#f7931e' : '#26a69a'}`,
                                            borderRadius: '4px',
                                            color: zoomLevel <= 1 ? '#f7931e' : '#26a69a',
                                            fontSize: '12px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }, children: [zoomLevel <= 1 && _jsx("span", { children: "\uD83D\uDD34" }), "\uD83D\uDCC5 ", zoomLabel, zoomLevel <= 1 && _jsx("span", { children: "(\uC2E4\uC2DC\uAC04)" })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsxs("label", { children: ["\uD83D\uDEA8 \uC77C\uC0AC\uB7C9 \uC784\uACC4\uAC12 (", unitLabels[column], ")"] }), _jsx("input", { type: "number", step: "10", value: currentPeakLimit || '', onChange: (e) => handlePeakLimitChange(e.target.value), placeholder: "\uC77C\uC0AC\uB7C9 \uC784\uACC4\uAC12", style: {
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
                                                }, children: "\uD83D\uDDD1\uFE0F \uC81C\uAC70" }))] })] })] }) }), _jsxs("div", { className: styles.chartSection, children: [_jsxs("div", { className: styles.chartToolbar, children: [_jsxs("div", { className: styles.chartTitle, children: ["\u2600\uFE0F ", columnLabels[column], " \uD0DC\uC591\uAD11 \uBD84\uC11D \uCC28\uD2B8"] }), _jsxs("div", { className: styles.chartControls, children: [_jsxs("span", { style: { fontSize: '11px', color: solarStatus.color, fontWeight: '600' }, children: [solarStatus.icon, " ", solarStatus.text, " \u2022 ", data.length, "\uAC1C \uB370\uC774\uD130"] }), currentPeakLimit && (_jsxs("span", { style: { fontSize: '11px', color: '#f6465d', fontWeight: '600' }, children: ["\u2022 \uD83D\uDEA8 \uC784\uACC4\uAC12: ", currentPeakLimit, " ", unitLabels[column]] })), _jsxs("span", { style: { fontSize: '11px', color: '#f7931e', fontWeight: '600' }, children: ["\u2022 \uD83D\uDCCA \uBC94\uC704: ", zoomLabel] }), zoomLevel >= 2 && (_jsx("span", { style: { fontSize: '11px', color: '#26a69a', fontWeight: '600' }, children: "\u2022 \uD83D\uDDB1\uFE0F \uD074\uB9AD\uC73C\uB85C \uB4DC\uB9B4\uB2E4\uC6B4 \uAC00\uB2A5" }))] })] }), _jsx("div", { style: { height: 'calc(100% - 60px)' }, children: _jsx(LineChartWrapper, { data: data, keys: [column], labels: columnLabels, xKey: "bucket", zoomLevel: zoomLevel, peakLimit: currentPeakLimit, peakLimitLabel: `${columnLabels[column]} 임계값: ${currentPeakLimit || 0}`, onDataPointClick: onDataPointClick, csvExport: {
                                    apiPath: '/data/solar/query',
                                    extraParams: { device_id: deviceId },
                                    filePrefix: `태양광데이터-센서${deviceId}-${zoomLabel}`,
                                } }) })] }), _jsxs("div", { className: styles.statsGrid, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uD604\uC7AC\uAC12" }), _jsx("div", { className: styles.statValue, children: currentValue.toFixed(0) }), _jsxs("div", { className: `${styles.statChange} ${valueChange < 0 ? styles.statChangeNegative : ''}`, children: [valueChange >= 0 ? '+' : '', valueChange.toFixed(0), " ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uD3C9\uADE0 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.avg?.toFixed(0) || '0' }), _jsxs("div", { className: styles.statChange, children: ["\uD3C9\uADE0 ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uACE0\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.max?.toFixed(0) || '0' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uACE0\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uC800\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.min?.toFixed(0) || '0' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uC800\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uCE21\uC815 \uD69F\uC218" }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.count || '0' }), _jsx("div", { className: styles.statChange, children: "\uD68C" })] }), currentPeakLimit && (_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uC784\uACC4\uAC12 \uC0C1\uD0DC" }), _jsx("div", { className: styles.statValue, style: {
                                        color: currentValue > currentPeakLimit ? '#f7931e' : '#0ecb81',
                                    }, children: currentValue > currentPeakLimit ? '☀️' : '🌤️' }), _jsx("div", { className: styles.statChange, children: currentValue > currentPeakLimit ? '강한 일사량' : '보통 일사량' })] }))] }), _jsxs("div", { className: styles.logPanel, children: [_jsx("div", { className: styles.logHeader, children: "\u2600\uFE0F \uD0DC\uC591\uAD11\uC13C\uC11C \uD65C\uB3D9 \uB85C\uADF8" }), logs.slice(-20).map((logEntry, index) => (_jsx("div", { className: styles.logItem, children: logEntry }, index))), logs.length === 0 && _jsx("div", { className: styles.logItem, children: "\uCD5C\uADFC \uD65C\uB3D9 \uC5C6\uC74C" })] })] }) }));
}
