import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Error from '@/components/common/Error';
import PeriodControls from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';
export default function SolarPresenter({ deviceId, setDeviceId, deviceOptions, preset, setPreset, mode, setMode, onQuery, data, stats, loading, error, logs, }) {
    const last = data?.length ? data[data.length - 1] : null;
    const realtimeSolarValue = last?.solar != null
        ? Number(last.solar)
        : last?.solar_irradiance_wm2 != null
            ? Number(last.solar_irradiance_wm2)
            : null;
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.card, children: _jsx("div", { style: { display: 'grid', gap: 8 }, children: _jsx(SummaryText, { title: "\uC77C\uC0AC\uB7C9", unit: "W/m\u00B2", mode: mode, realtimeValue: realtimeSolarValue, stats: stats?.solar }) }) }), _jsx("div", { className: styles.card, children: _jsxs("div", { className: styles.controls, children: [_jsxs("div", { className: "row", children: [_jsx("label", { children: "Device" }), _jsxs("select", { value: deviceId ?? '', onChange: (e) => setDeviceId(e.target.value === '' ? null : Number(e.target.value)), children: [_jsx("option", { value: "", children: "All" }), deviceOptions.map((id) => (_jsx("option", { value: id, children: id }, id)))] })] }), _jsx("div", { className: "row", children: _jsx(PeriodControls, { mode: mode, setMode: setMode, preset: preset, setPreset: setPreset, onQuery: onQuery, loading: loading }) })] }) }), _jsx("div", { className: styles.card, style: { height: 360 }, children: error ? (_jsx(Error, { msg: error })) : (_jsx(LineChartWrapper, { data: data, keys: ['solar'], labels: { solar: '일사량 (W/m²)' }, xKey: "bucket", csvExport: {
                        apiPath: '/data/solar/query',
                        extraParams: { device_id: deviceId ?? undefined },
                        filePrefix: 'solar',
                    } })) }), _jsx("div", { className: styles.card, children: _jsx(StatsPanel, { title: "\uC694\uC57D \uD1B5\uACC4", stats: stats ?? {} }) }), _jsx("div", { className: styles.card, children: _jsx(LogPanel, { logs: logs }) })] }));
}
