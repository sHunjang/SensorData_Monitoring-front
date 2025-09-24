import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// LineChartWrapper.tsx
/**
 * 범용 라인차트 + CSV 다운로드 UI
 *
 * 변경 사항 요약:
 * - CSV 다운로드 UI: "Download visible range" 버튼(그래프에 보이는 구간)
 *   및 "Download by range" (캘린더(datetime-local)로 start/end 지정) 복원.
 * - 서버 쿼리 키 정규화: extraParams에 camelCase인 deviceId가 있으면 device_id로 변환.
 * - max_points 클라이언트 캡(서버 제한에 맞춤, 기본 5000).
 * - bucket이 ISO 문자열이면 Date.parse 사용. 숫자(밀리초)면 그대로 사용.
 * - CSV 변환은 중첩 객체/Date 등 방어적으로 직렬화.
 * - 에러/다운로드 상태 토글링 및 사용자 알림.
 *
 * 사용법:
 * <LineChartWrapper
 *   data={data}
 *   keys={['solar']}
 *   labels={{ solar: '일사량 (W/m²)' }}
 *   xKey="bucket"
 *   csvExport={{ apiPath: '/data/solar/query', extraParams: { device_id: 1 }, filePrefix: 'solar' }}
 * />
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
function toQueryString(params) {
    const esc = encodeURIComponent;
    const parts = [];
    for (const k of Object.keys(params)) {
        const v = params[k];
        if (v == null)
            continue;
        parts.push(`${esc(k)}=${esc(String(v))}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
}
/** 안전한 JSON -> CSV 변환기 (헤더 순서: 첫 등장 순서 보존) */
function jsonToCsv(rows) {
    if (!Array.isArray(rows) || rows.length === 0)
        return '';
    const headerOrder = [];
    const seen = new Set();
    for (const r of rows) {
        if (r && typeof r === 'object') {
            for (const k of Object.keys(r)) {
                if (!seen.has(k)) {
                    seen.add(k);
                    headerOrder.push(k);
                }
            }
        }
    }
    const serialize = (v) => {
        if (v == null)
            return '';
        if (v instanceof Date)
            return v.toISOString();
        const t = typeof v;
        if (t === 'string')
            return v;
        if (t === 'number' || t === 'boolean' || t === 'bigint')
            return String(v);
        try {
            return JSON.stringify(v);
        }
        catch {
            return String(v);
        }
    };
    const escapeCell = (raw) => {
        const s = serialize(raw);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const lines = [];
    lines.push(headerOrder.join(','));
    for (const r of rows) {
        const cells = headerOrder.map((h) => escapeCell(r?.[h]));
        lines.push(cells.join(','));
    }
    const BOM = '\uFEFF';
    return BOM + lines.join('\n');
}
/** bucket 값에서 ms(Unix ms)를 얻음. (ISO string or numeric) */
function bucketToMs(v) {
    if (v == null)
        return null;
    if (typeof v === 'number')
        return Number(v);
    // 문자열: try parse
    const n = Date.parse(String(v));
    return Number.isNaN(n) ? null : n;
}
export default function LineChartWrapper({ data, keys, labels, xKey = 'bucket', csvExport = null }) {
    const [downloading, setDownloading] = useState(false);
    const [openRangePicker, setOpenRangePicker] = useState(false);
    const [startInput, setStartInput] = useState('');
    const [endInput, setEndInput] = useState('');
    // visible range: compute min/max ms from data
    const visibleRange = useMemo(() => {
        let min = Infinity;
        let max = -Infinity;
        for (const r of data ?? []) {
            const ms = bucketToMs(r?.[xKey]);
            if (ms == null)
                continue;
            if (ms < min)
                min = ms;
            if (ms > max)
                max = ms;
        }
        if (min === Infinity || max === -Infinity)
            return null;
        return { min, max };
    }, [data, xKey]);
    // normalize extraParams: deviceId -> device_id
    function normalizeParams(p = {}) {
        const out = {};
        for (const k of Object.keys(p)) {
            if (k === 'deviceId')
                out['device_id'] = p[k];
            else
                out[k] = p[k];
        }
        return out;
    }
    async function fetchAndSaveCsvByRange(startMs, endMs) {
        if (!csvExport)
            return;
        setDownloading(true);
        try {
            // 서버 제한 값: 안전하게 cap
            const SERVER_MAX = csvExport.maxPoints ?? 5000;
            const extra = normalizeParams(csvExport.extraParams ?? {});
            // build params - server expects ISO strings for start/end
            const params = {
                ...extra,
                start: new Date(startMs).toISOString(),
                end: new Date(endMs).toISOString(),
                max_points: SERVER_MAX,
            };
            const qs = toQueryString(params);
            const url = `${csvExport.apiPath}${qs}`;
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Server ${res.status} ${res.statusText} ${text}`);
            }
            const json = await res.json();
            const rows = Array.isArray(json.data) ? json.data : [];
            // normalize bucket field to ISO string for CSV readability
            const prepared = rows.map((r) => {
                const out = { ...r };
                const b = out[xKey];
                if (b != null) {
                    const ms = bucketToMs(b);
                    out[xKey] = ms == null ? String(b) : new Date(ms).toISOString();
                }
                return out;
            });
            const csv = jsonToCsv(prepared);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const filename = `${csvExport.filePrefix ?? 'export'}_${new Date(startMs)
                .toISOString()
                .replace(/[:.]/g, '-')}_${new Date(endMs).toISOString().replace(/[:.]/g, '-')}.csv`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (err) {
            console.error('CSV download error', err);
            alert('CSV 다운로드 실패: ' + (err?.message ?? String(err)));
        }
        finally {
            setDownloading(false);
            setOpenRangePicker(false);
        }
    }
    function handleDownloadVisible() {
        if (!visibleRange) {
            alert('차트에 표시된 기간 데이터가 없습니다.');
            return;
        }
        fetchAndSaveCsvByRange(visibleRange.min, visibleRange.max);
    }
    function handleDownloadByInputs() {
        if (!startInput || !endInput) {
            alert('시작 시간과 종료 시간을 모두 입력하세요.');
            return;
        }
        // datetime-local -> treat as local time -> convert to ms
        const sMs = Date.parse(startInput);
        const eMs = Date.parse(endInput);
        if (Number.isNaN(sMs) || Number.isNaN(eMs)) {
            alert('유효한 날짜를 입력하세요.');
            return;
        }
        if (sMs > eMs) {
            alert('시작 시간은 종료 시간보다 앞서야 합니다.');
            return;
        }
        fetchAndSaveCsvByRange(sMs, eMs);
    }
    // X축 tick formatter: display KST HH:MM if possible
    function fmtTick(v) {
        const ms = bucketToMs(v);
        if (ms == null)
            return String(v ?? '');
        return new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul',
            hour12: false,
        }).format(new Date(ms));
    }
    return (_jsxs("div", { style: { width: '100%', height: '100%' }, children: [csvExport && (_jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }, children: [_jsx("button", { onClick: handleDownloadVisible, disabled: downloading, children: "Download visible range (CSV)" }), _jsx("button", { onClick: () => {
                            setOpenRangePicker((s) => !s);
                        }, disabled: downloading, children: openRangePicker ? 'Cancel' : 'Download by range (calendar)' }), openRangePicker && (_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("input", { type: "datetime-local", value: startInput, onChange: (e) => setStartInput(e.target.value), "aria-label": "start" }), _jsx("input", { type: "datetime-local", value: endInput, onChange: (e) => setEndInput(e.target.value), "aria-label": "end" }), _jsx("button", { onClick: handleDownloadByInputs, disabled: downloading, children: downloading ? 'Downloading...' : 'Download CSV' })] }))] })), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: data, margin: { top: 8, right: 16, bottom: 8, left: 0 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: xKey, tickFormatter: fmtTick, 
                            // set type/scale if bucket are numerical (ms); many backends return ISO string so keep default
                            // Recharts sometimes duplicates tick keys when data contains duplicate x values.
                            // We avoid passing tick objects as children; rely on built-in tick generation.
                            minTickGap: 24 }), _jsx(YAxis, { allowDecimals: true }), _jsx(Tooltip, { labelFormatter: (v) => {
                                const ms = bucketToMs(v);
                                if (ms == null)
                                    return String(v ?? '');
                                return new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
                            } }), _jsx(Legend, {}), keys.map((k) => (_jsx(Line, { type: "monotone", dataKey: k, name: labels[k] ?? k, dot: false, isAnimationActive: false, strokeWidth: 2 }, k)))] }) })] }));
}
