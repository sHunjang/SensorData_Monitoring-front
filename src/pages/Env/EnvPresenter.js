import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
export default function EnvPresenter({ deviceId, setDeviceId, deviceOptions, column, setColumn, zoomLevel, zoomLabel, onZoomIn, onZoomOut, canZoomIn, canZoomOut, onDataPointClick, onManualRefresh, data, stats, loading, error, logs, peakLimits, setPeakLimits, }) {
    // 🔄 로딩 및 에러 상태 처리
    if (loading)
        return _jsx(Loading, {});
    if (error)
        return _jsx(Error, { msg: error });
    // ============= 환경 센서 실시간 값 및 변화량 계산 =============
    const lastDataPoint = data?.length ? data[data.length - 1] : null;
    const currentValue = lastDataPoint?.[column] ?? 0;
    const previousValue = data?.length > 1 ? data[data.length - 2]?.[column] ?? 0 : 0;
    const valueChange = currentValue - previousValue;
    const changePercent = previousValue ? ((valueChange / previousValue) * 100).toFixed(2) : '0.00';
    // 🎯 현재 컬럼의 환경 임계값
    const currentPeakLimit = peakLimits[column];
    // 🏷️ 환경센서 컬럼별 한글 라벨 정의
    const columnLabels = {
        temperature: '온도 (°C)',
        humidity: '습도 (%)',
    };
    // 🏷️ 환경센서 컬럼별 단위 정의
    const unitLabels = {
        temperature: '°C',
        humidity: '%',
    };
    /**
     * 🌡️ 환경센서 상태 판정 함수
     */
    const getEnvironmentStatus = (value, columnType) => {
        switch (columnType) {
            case 'temperature':
                if (value >= 35)
                    return { text: '고온경보', color: '#f6465d', icon: '🔥' };
                if (value >= 30)
                    return { text: '고온주의', color: '#f7931e', icon: '🌡️' };
                if (value >= 20)
                    return { text: '적정온도', color: '#0ecb81', icon: '✅' };
                if (value >= 10)
                    return { text: '저온주의', color: '#f7931e', icon: '❄️' };
                return { text: '저온경보', color: '#f6465d', icon: '🧊' };
            case 'humidity':
                if (value >= 80)
                    return { text: '고습경보', color: '#f6465d', icon: '💧' };
                if (value >= 70)
                    return { text: '고습주의', color: '#f7931e', icon: '🌫️' };
                if (value >= 40)
                    return { text: '적정습도', color: '#0ecb81', icon: '✅' };
                if (value >= 30)
                    return { text: '건조주의', color: '#f7931e', icon: '🏜️' };
                return { text: '건조경보', color: '#f6465d', icon: '🔥' };
            default:
                return { text: '측정중', color: '#0ecb81', icon: '📊' };
        }
    };
    /**
     * 🚨 환경 임계값 업데이트 함수
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
     * 🗑️ 환경 임계값 제거 함수
     */
    const handlePeakLimitRemove = () => {
        setPeakLimits((prev) => {
            const updated = { ...prev };
            delete updated[column];
            return updated;
        });
    };
    const environmentStatus = getEnvironmentStatus(currentValue, column);
    // ============= 환경센서 UI 렌더링 =============
    return (_jsx("div", { className: styles.container, children: _jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsxs("h1", { className: styles.title, children: ["\uD83C\uDF21\uFE0F ENV-", deviceId] }), _jsxs("div", { className: styles.subtitle, children: ["\uD658\uACBD \uBAA8\uB2C8\uD130\uB9C1 \u2022 ", zoomLabel, " \uBC94\uC704"] })] }), _jsxs("div", { className: styles.priceInfo, children: [_jsxs("h2", { className: styles.currentPrice, children: [currentValue.toFixed(1), " ", unitLabels[column]] }), _jsxs("div", { className: `${styles.priceChange} ${valueChange < 0 ? styles.priceChangeNegative : ''}`, children: [_jsx("span", { children: valueChange >= 0 ? '📈' : '📉' }), _jsxs("span", { children: [changePercent, "%"] }), _jsxs("span", { children: ["(", valueChange >= 0 ? '+' : '', valueChange.toFixed(1), ")"] })] })] })] }), _jsx("div", { className: styles.controls, children: _jsxs("div", { className: styles.controlsGrid, children: [_jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD658\uACBD\uC13C\uC11C" }), _jsx("select", { value: deviceId, onChange: (e) => setDeviceId(Number(e.target.value)), children: deviceOptions.map((id) => (_jsxs("option", { value: id, children: ["\uC13C\uC11C ", id] }, id))) })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uCE21\uC815 \uD56D\uBAA9" }), _jsxs("select", { value: column, onChange: (e) => setColumn(e.target.value), children: [_jsx("option", { value: "temperature", children: "\uD83C\uDF21\uFE0F \uC628\uB3C4 (\u00B0C)" }), _jsx("option", { value: "humidity", children: "\uD83D\uDCA7 \uC2B5\uB3C4 (%)" })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsx("label", { children: "\uD83D\uDD0D \uC2DC\uAC04 \uBC94\uC704" }), _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx("button", { onClick: onZoomIn, disabled: !canZoomIn, style: {
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
                                            border: `2px solid ${zoomLevel <= 1 ? '#26a69a' : '#f7931e'}`,
                                            borderRadius: '4px',
                                            color: zoomLevel <= 1 ? '#26a69a' : '#f7931e',
                                            fontSize: '12px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }, children: [zoomLevel <= 1 && _jsx("span", { children: "\uD83D\uDD34" }), "\uD83D\uDCC5 ", zoomLabel, zoomLevel <= 1 && _jsx("span", { children: "(\uC2E4\uC2DC\uAC04)" })] })] }), _jsxs("div", { className: styles.controlGroup, children: [_jsxs("label", { children: ["\uD83D\uDEA8 \uD658\uACBD \uC784\uACC4\uAC12 (", unitLabels[column], ")"] }), _jsx("input", { type: "number", step: column === 'temperature' ? '0.1' : '1', value: currentPeakLimit || '', onChange: (e) => handlePeakLimitChange(e.target.value), placeholder: column === 'temperature' ? '온도 임계값' : '습도 임계값', style: {
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
                                                }, children: "\uD83D\uDDD1\uFE0F \uC81C\uAC70" }))] })] })] }) }), _jsxs("div", { className: styles.chartSection, children: [_jsxs("div", { className: styles.chartToolbar, children: [_jsxs("div", { className: styles.chartTitle, children: ["\uD83C\uDF21\uFE0F ", columnLabels[column], " \uD658\uACBD \uBD84\uC11D \uCC28\uD2B8"] }), _jsxs("div", { className: styles.chartControls, children: [_jsxs("span", { style: { fontSize: '11px', color: environmentStatus.color, fontWeight: '600' }, children: [environmentStatus.icon, " ", environmentStatus.text, " \u2022 ", data.length, "\uAC1C \uB370\uC774\uD130"] }), currentPeakLimit && (_jsxs("span", { style: { fontSize: '11px', color: '#f6465d', fontWeight: '600' }, children: ["\u2022 \uD83D\uDEA8 \uC784\uACC4\uAC12: ", currentPeakLimit, " ", unitLabels[column]] })), _jsxs("span", { style: { fontSize: '11px', color: '#f7931e', fontWeight: '600' }, children: ["\u2022 \uD83D\uDCCA \uBC94\uC704: ", zoomLabel] }), zoomLevel >= 2 && (_jsx("span", { style: { fontSize: '11px', color: '#26a69a', fontWeight: '600' }, children: "\u2022 \uD83D\uDDB1\uFE0F \uD074\uB9AD\uC73C\uB85C \uB4DC\uB9B4\uB2E4\uC6B4 \uAC00\uB2A5" }))] })] }), _jsx("div", { style: { height: 'calc(100% - 60px)' }, children: _jsx(LineChartWrapper, { data: data, keys: [column], labels: columnLabels, xKey: "bucket", zoomLevel: zoomLevel, peakLimit: currentPeakLimit, peakLimitLabel: `${columnLabels[column]} 임계값: ${currentPeakLimit || 0}`, onDataPointClick: onDataPointClick, csvExport: {
                                    apiPath: '/data/env/query',
                                    extraParams: { device_id: deviceId },
                                    filePrefix: `환경데이터-센서${deviceId}-${zoomLabel}`,
                                } }) })] }), _jsxs("div", { className: styles.statsGrid, children: [_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uD604\uC7AC\uAC12" }), _jsx("div", { className: styles.statValue, children: currentValue.toFixed(1) }), _jsxs("div", { className: `${styles.statChange} ${valueChange < 0 ? styles.statChangeNegative : ''}`, children: [valueChange >= 0 ? '+' : '', valueChange.toFixed(1), " ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uD3C9\uADE0 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.avg?.toFixed(1) || '0.0' }), _jsxs("div", { className: styles.statChange, children: ["\uD3C9\uADE0 ", unitLabels[column]] })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uACE0\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.max?.toFixed(1) || '0.0' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uACE0\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsxs("div", { className: styles.statLabel, children: ["\uCD5C\uC800\uAC12 (", zoomLabel, ")"] }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.min?.toFixed(1) || '0.0' }), _jsx("div", { className: styles.statChange, children: "\uCD5C\uC800\uAC12" })] }), _jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uCE21\uC815 \uD69F\uC218" }), _jsx("div", { className: styles.statValue, children: stats?.[column]?.count || '0' }), _jsx("div", { className: styles.statChange, children: "\uD68C" })] }), currentPeakLimit && (_jsxs("div", { className: styles.statCard, children: [_jsx("div", { className: styles.statLabel, children: "\uC784\uACC4\uAC12 \uC0C1\uD0DC" }), _jsx("div", { className: styles.statValue, style: {
                                        color: (column === 'temperature' && currentValue > currentPeakLimit) ||
                                            (column === 'humidity' && currentValue > currentPeakLimit)
                                            ? '#f6465d'
                                            : '#0ecb81',
                                    }, children: (column === 'temperature' && currentValue > currentPeakLimit) ||
                                        (column === 'humidity' && currentValue > currentPeakLimit)
                                        ? '⚠️'
                                        : '✅' }), _jsx("div", { className: styles.statChange, children: (column === 'temperature' && currentValue > currentPeakLimit) ||
                                        (column === 'humidity' && currentValue > currentPeakLimit)
                                        ? '임계값 초과'
                                        : '정상 범위' })] }))] }), _jsxs("div", { className: styles.logPanel, children: [_jsx("div", { className: styles.logHeader, children: "\uD83C\uDF21\uFE0F \uD658\uACBD\uC13C\uC11C \uD65C\uB3D9 \uB85C\uADF8" }), logs.slice(-20).map((logEntry, index) => (_jsx("div", { className: styles.logItem, children: logEntry }, index))), logs.length === 0 && _jsx("div", { className: styles.logItem, children: "\uCD5C\uADFC \uD65C\uB3D9 \uC5C6\uC74C" })] })] }) }));
}
