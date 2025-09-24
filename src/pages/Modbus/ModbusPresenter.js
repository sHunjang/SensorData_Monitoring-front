import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import PeriodControls from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import SummaryText from '@/components/metrics/SummaryText';
import StatsPanel from '@/components/metrics/StatsPanel';
export default function ModbusPresenter({ deviceId, setDeviceId, deviceOptions, column, setColumn, preset, setPreset, mode, setMode, onQuery, data, stats, loading, error, logs, }) {
    const last = data?.length ? data[data.length - 1] : null;
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.card, children: _jsxs("div", { style: { display: 'grid', gap: 8 }, children: [_jsx(SummaryText, { title: "\uC2E4\uC2DC\uAC04 \uC804\uB825", unit: "kW", mode: mode, realtimeValue: last?.power ?? last?.p_kw ?? null, stats: stats?.power }), _jsx(SummaryText, { title: "\uB2F9\uC77C \uC804\uB825\uB7C9", unit: "kWh", mode: mode, realtimeValue: last?.energy ?? last?.e_kwh ?? null, stats: stats?.energy })] }) }), _jsx("div", { className: styles.card, children: _jsxs("div", { className: styles.toolbar, children: [_jsxs("div", { className: "row", children: [_jsx("label", { children: "Device" }), _jsx("select", { value: deviceId, onChange: (e) => setDeviceId(Number(e.target.value)), children: deviceOptions.map((d) => (_jsx("option", { value: d, children: d }, d))) })] }), _jsxs("div", { className: "row", children: [_jsx("label", { children: "Series" }), _jsxs("select", { value: column, onChange: (e) => setColumn(e.target.value), children: [_jsx("option", { value: "power", children: "Power (kW)" }), _jsx("option", { value: "energy", children: "Energy (kWh)" }), _jsx("option", { value: "voltage", children: "Voltage (V)" }), _jsx("option", { value: "current", children: "Current (A)" }), _jsx("option", { value: "pf", children: "Power Factor" })] })] }), _jsx("div", { className: "row", children: _jsx(PeriodControls, { mode: mode, setMode: setMode, preset: preset, setPreset: setPreset, onQuery: onQuery, loading: loading }) })] }) }), _jsx("div", { className: styles.card, style: { height: 420 }, children: loading ? (_jsx(Loading, {})) : error ? (_jsx(Error, { msg: error })) : (_jsx(LineChartWrapper, { data: data, keys: ['total_active_power_kw', 'total_active_energy_kwh'], labels: { total_active_power_kw: '전력 (kW)', total_active_energy_kwh: '에너지 (kWh)' }, xKey: "bucket", csvExport: {
                        apiPath: '/data/modbus/query',
                        extraParams: { device_id: deviceId ?? undefined }, // 필수라면 선택자에서 전달
                        filePrefix: 'modbus',
                    } })) }), _jsx("div", { className: styles.card, children: _jsx(StatsPanel, { title: "\uD1B5\uACC4", stats: stats ?? {} }) }), _jsx("div", { className: styles.card, children: _jsx(LogPanel, { logs: logs }) })] }));
}
