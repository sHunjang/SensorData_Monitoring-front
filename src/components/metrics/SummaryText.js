import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './SummaryText.module.css'; // 없으면 기본 스타일로 대체
export default function SummaryText(props) {
    const { title, unit = '', mode = 'realtime', realtimeValue, stats } = props;
    // 후보 키 목록: 실제 프로젝트에서 사용되는 필드명 우선순위로 둠.
    const CANDIDATE_KEYS = [
        'metrics.p_kw',
        'metrics.e_kwh',
        'metrics.p_kw',
        'p_kw',
        'e_kwh',
        'power',
        'energy',
        'total_active_power_kw',
        'total_active_energy_kwh',
        'total_active_kw',
        'total_active_energy_kwh',
        'value',
        'val',
    ];
    // 객체에서 경로(keypath)로 값 가져오기 (e.g. "metrics.p_kw")
    function getByPath(obj, path) {
        if (!obj || typeof obj !== 'object')
            return undefined;
        const parts = path.split('.');
        let cur = obj;
        for (const p of parts) {
            if (cur == null)
                return undefined;
            cur = cur[p];
        }
        return cur;
    }
    // 숫자인지 판별 (숫자문자열도 허용)
    function toNumberOrNull(x) {
        if (x == null)
            return null;
        if (typeof x === 'number') {
            return Number.isFinite(x) ? x : null;
        }
        if (typeof x === 'string') {
            const n = Number(x);
            return Number.isFinite(n) ? n : null;
        }
        return null;
    }
    // realtimeValue에서 숫자 추출
    function extractValue(rv) {
        // 1) 직접 숫자/숫자문자열
        const direct = toNumberOrNull(rv);
        if (direct !== null)
            return direct;
        // 2) 객체인 경우: 후보 키 순회
        if (rv && typeof rv === 'object') {
            for (const key of CANDIDATE_KEYS) {
                const v = getByPath(rv, key);
                const n = toNumberOrNull(v);
                if (n !== null)
                    return n;
            }
            // 3) 객체의 최상위 값들 중 숫자 찾기 (예: {p_kw:..., other:...})
            for (const k of Object.keys(rv)) {
                const n = toNumberOrNull(rv[k]);
                if (n !== null)
                    return n;
            }
            // 4) metrics 프로퍼티가 객체이면 그 안에서 숫자 찾기
            if (rv.metrics && typeof rv.metrics === 'object') {
                for (const k of Object.keys(rv.metrics)) {
                    const n = toNumberOrNull(rv.metrics[k]);
                    if (n !== null)
                        return n;
                }
            }
        }
        return null;
    }
    const value = extractValue(realtimeValue);
    return (_jsxs("div", { className: styles.summary ?? '', style: { padding: 12 }, children: [_jsx("div", { style: { fontSize: 12, color: '#666' }, children: title }), _jsx("div", { style: { fontSize: 24, fontWeight: 600, marginTop: 6 }, children: value == null ? '-' : `${value}${unit ? ' ' + unit : ''}` }), mode === 'range' && stats ? (_jsxs("div", { style: { fontSize: 12, color: '#444', marginTop: 8 }, children: [_jsxs("div", { children: ["avg: ", stats?.avg ?? '-'] }), _jsxs("div", { children: ["max: ", stats?.max ?? '-'] }), _jsxs("div", { children: ["min: ", stats?.min ?? '-'] })] })) : null] }));
}
