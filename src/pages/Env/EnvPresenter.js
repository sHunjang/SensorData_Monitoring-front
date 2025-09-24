import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Env/EnvPresenter.tsx
/**
 * EnvPresenter
 *
 * 목적:
 * - EnvContainer에서 제공하는 상태를 받아 UI로 렌더링.
 * - 차트, 통계, 로그, 컨트롤을 배치.
 * - 장치 선택(deviceId)을 지원하여 특정 센서(예: 21,22,23)만 조회 가능.
 *
 * 사용법:
 * - 컨테이너는 deviceId: number | null 과 setDeviceId: (id: number|null) => void 를 전달해야 함.
 * - onQuery는 deviceId 상태를 반영한 fetch 호출을 수행해야 함.
 */
import styles from './Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import PeriodControls from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';
export default function EnvPresenter(p) {
    const { mode, setMode, preset, setPreset, onQuery, data, stats, loading, error, logs, deviceId, setDeviceId } = p;
    // 기본 장치 목록. 필요시 컨테이너 또는 서버에서 동적으로 공급하도록 변경 가능.
    const deviceOptions = [21, 22, 23];
    const last = data?.length ? data[data.length - 1] : null;
    // 장치 선택이 변경되면 즉시 쿼리 실행
    const handleDeviceChange = (v) => {
        if (!setDeviceId)
            return;
        const id = v === '' ? null : Number(v);
        setDeviceId(id);
        // 선택 즉시 데이터 갱신 요청
        try {
            onQuery();
        }
        catch {
            /* onQuery may be sync/async; ignore errors here */
        }
    };
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.card, children: _jsxs("div", { style: { display: 'grid', gap: 6 }, children: [_jsx(SummaryText, { title: "\uC628\uB3C4", unit: "\u00B0C", mode: mode, realtimeValue: last?.temperature ?? null, stats: stats?.temperature }), _jsx(SummaryText, { title: "\uC2B5\uB3C4", unit: "%", mode: mode, realtimeValue: last?.humidity ?? null, stats: stats?.humidity })] }) }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx(PeriodControls, { mode: mode, setMode: setMode, preset: preset, setPreset: setPreset, onQuery: onQuery, loading: loading }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 13 }, children: "Device" }), setDeviceId ? (_jsxs("select", { value: deviceId ?? '', onChange: (e) => handleDeviceChange(e.target.value), style: { padding: '4px 8px' }, children: [_jsx("option", { value: "", children: "All" }), deviceOptions.map((id) => (_jsx("option", { value: id, children: id }, id)))] })) : (_jsx("div", { style: { paddingLeft: 8 }, children: deviceId ?? 'All' }))] })] }), _jsx("div", { className: styles.card, style: { height: 360 }, children: _jsx(LineChartWrapper, { data: data, keys: ['temperature', 'humidity'], labels: { temperature: '온도 (°C)', humidity: '습도 (%)' }, xKey: "bucket", csvExport: {
                        apiPath: '/data/env/query',
                        extraParams: { device_id: deviceId ?? undefined },
                        filePrefix: 'env',
                    } }) }), _jsx("div", { className: styles.card, children: _jsx(StatsPanel, { title: "\uC694\uC57D \uD1B5\uACC4", stats: stats ?? {} }) }), _jsx("div", { className: styles.card, children: _jsx(LogPanel, { logs: logs }) })] }));
}
