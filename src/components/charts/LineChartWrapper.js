import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/charts/LineChartWrapper.tsx
/**
 * LineChartWrapper.tsx - 모든 페이지 공통 드릴다운 차트 시스템
 *
 * 🎯 핵심 기능:
 * - 스마트 드릴다운: 주간→일간, 월간→주간 등 자동 전환
 * - 6단계 줌 레벨: 1시간 → 1일 → 1주일 → 1달 → 6개월 → 1년
 * - 동적 X축 포맷: 범위에 따라 시간 표시 형식 자동 변경
 * - 클릭 인터랙션: 데이터 포인트 클릭으로 더 세부적인 범위로 이동
 * - ISO 문자열 완전 지원: 백엔드 bucket 필드 자동 파싱
 * - 피크선 표시: 설정 가능한 임계값 시각화
 * - CSV 다운로드: 현재 보이는 범위 또는 사용자 지정 범위
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, ReferenceLine, } from 'recharts';
// 🎯 줌 레벨별 X축 시간 표시 포맷 정의
const ZOOM_TIME_FORMATS = {
    0: {
        // 1시간 범위: 분:초 단위로 표시
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Seoul',
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        name: '1시간',
    },
    1: {
        // 1일 범위: 시:분 단위로 표시 (24시간 형식)
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul',
            hour12: false,
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        name: '1일',
    },
    2: {
        // 1주일 범위: 요일과 날짜로 표시 (월, 화, 수...)
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Seoul',
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        }),
        name: '1주일',
    },
    3: {
        // 1달 범위: 일 단위로 표시 (1, 2, 3...)
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            day: 'numeric',
            timeZone: 'Asia/Seoul',
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }),
        name: '1달',
    },
    4: {
        // 6개월 범위: 월일로 표시 (1월 15일, 2월 1일...)
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Seoul',
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: 'long',
        }),
        name: '6개월',
    },
    5: {
        // 1년 범위: 월 단위로 표시 (1월, 2월, 3월...)
        format: (ms) => new Intl.DateTimeFormat('ko-KR', {
            month: 'short',
            timeZone: 'Asia/Seoul',
        }).format(new Date(ms)),
        tooltip: (ms) => new Date(ms).toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: 'long',
        }),
        name: '1년',
    },
};
/**
 * 🔧 bucket 값을 밀리초 타임스탬프로 변환
 * - 숫자인 경우: 그대로 사용 (이미 Unix 밀리초)
 * - 문자열인 경우: ISO 문자열로 파싱 (백엔드에서 보내는 형식)
 */
function bucketToMs(value) {
    if (value == null)
        return null;
    if (typeof value === 'number')
        return Number(value);
    // ISO 문자열 파싱 시도
    const parsedMs = Date.parse(String(value));
    return Number.isNaN(parsedMs) ? null : parsedMs;
}
/**
 * 🔧 객체를 URL 쿼리 스트링으로 변환
 */
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
/**
 * 🔧 JSON 데이터를 CSV 형식으로 변환
 */
function jsonToCsv(rows) {
    if (!Array.isArray(rows) || rows.length === 0)
        return '';
    // 헤더 순서 결정 (모든 행의 키를 수집)
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
    // 값을 CSV에 적합한 문자열로 변환
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
    // CSV 셀 이스케이프 (쉼표, 따옴표, 개행 처리)
    const escapeCell = (raw) => {
        const s = serialize(raw);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    // CSV 생성
    const lines = [];
    lines.push(headerOrder.join(','));
    for (const r of rows) {
        const cells = headerOrder.map((h) => escapeCell(r?.[h]));
        lines.push(cells.join(','));
    }
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    return BOM + lines.join('\n');
}
export default function LineChartWrapper({ data, keys, labels, xKey = 'bucket', csvExport = null, peakLimit, peakLimitLabel, onDataPointClick, zoomLevel = 2, // 기본값: 1주일 보기
 }) {
    // 📥 CSV 다운로드 상태 관리
    const [downloading, setDownloading] = useState(false);
    const [openRangePicker, setOpenRangePicker] = useState(false);
    const [startInput, setStartInput] = useState('');
    const [endInput, setEndInput] = useState('');
    // 🎯 현재 줌 레벨에 맞는 시간 포맷터 선택
    const currentFormatter = ZOOM_TIME_FORMATS[zoomLevel] || ZOOM_TIME_FORMATS[2];
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const timeA = bucketToMs(a[xKey]) || 0;
            const timeB = bucketToMs(b[xKey]) || 0;
            return timeA - timeB; // 과거 → 최신 순서로 정렬
        });
    }, [data, xKey]);
    // 👀 차트에 표시되는 데이터 시간 범위 계산
    const visibleTimeRange = useMemo(() => {
        let minTime = Infinity;
        let maxTime = -Infinity;
        for (const row of data ?? []) {
            const timeMs = bucketToMs(row?.[xKey]);
            if (timeMs == null)
                continue;
            if (timeMs < minTime)
                minTime = timeMs;
            if (timeMs > maxTime)
                maxTime = timeMs;
        }
        if (minTime === Infinity || maxTime === -Infinity)
            return null;
        return { min: minTime, max: maxTime };
    }, [data, xKey]);
    // 🔧 API 호출용 파라미터 정규화 (deviceId → device_id)
    function normalizeApiParams(params = {}) {
        const normalized = {};
        for (const key of Object.keys(params)) {
            if (key === 'deviceId')
                normalized['device_id'] = params[key];
            else
                normalized[key] = params[key];
        }
        return normalized;
    }
    // 📥 지정된 시간 범위의 데이터를 CSV로 다운로드
    async function downloadCsvByTimeRange(startTimeMs, endTimeMs) {
        if (!csvExport)
            return;
        setDownloading(true);
        try {
            const SERVER_MAX_POINTS = csvExport.maxPoints ?? 5000;
            const normalizedParams = normalizeApiParams(csvExport.extraParams ?? {});
            const apiParams = {
                ...normalizedParams,
                start: new Date(startTimeMs).toISOString(),
                end: new Date(endTimeMs).toISOString(),
                max_points: SERVER_MAX_POINTS,
            };
            const queryString = toQueryString(apiParams);
            const apiUrl = `${csvExport.apiPath}${queryString}`;
            const response = await fetch(apiUrl, { method: 'GET' });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`서버 오류 ${response.status} ${response.statusText} ${errorText}`);
            }
            const responseData = await response.json();
            const dataRows = Array.isArray(responseData.data) ? responseData.data : [];
            // 🕐 bucket 필드를 읽기 쉬운 ISO 문자열로 변환
            const preparedRows = dataRows.map((row) => {
                const processedRow = { ...row };
                const bucketValue = processedRow[xKey];
                if (bucketValue != null) {
                    const timeMs = bucketToMs(bucketValue);
                    processedRow[xKey] = timeMs == null ? String(bucketValue) : new Date(timeMs).toISOString();
                }
                return processedRow;
            });
            const csvContent = jsonToCsv(preparedRows);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            // 파일명 생성 (시작시간_끝시간.csv)
            const startStr = new Date(startTimeMs).toISOString().replace(/[:.]/g, '-');
            const endStr = new Date(endTimeMs).toISOString().replace(/[:.]/g, '-');
            const filename = `${csvExport.filePrefix ?? 'export'}_${startStr}_${endStr}.csv`;
            // 파일 다운로드 실행
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();
        }
        catch (error) {
            console.error('CSV 다운로드 오류:', error);
            alert('CSV 다운로드에 실패했습니다: ' + (error?.message ?? String(error)));
        }
        finally {
            setDownloading(false);
            setOpenRangePicker(false);
        }
    }
    // 🖱️ 데이터 포인트 클릭 시 드릴다운 처리
    function handleChartClick(clickData) {
        if (!onDataPointClick)
            return;
        const timeMs = bucketToMs(clickData?.[xKey]);
        if (timeMs == null)
            return;
        // Container로 클릭된 시간과 데이터를 전달
        onDataPointClick(clickData, timeMs);
    }
    // 📥 현재 화면에 보이는 범위의 CSV 다운로드
    function handleDownloadVisibleRange() {
        if (!visibleTimeRange) {
            alert('차트에 표시된 데이터가 없어 다운로드할 수 없습니다.');
            return;
        }
        downloadCsvByTimeRange(visibleTimeRange.min, visibleTimeRange.max);
    }
    // 📅 사용자가 입력한 기간의 CSV 다운로드
    function handleDownloadByUserInput() {
        if (!startInput || !endInput) {
            alert('시작 시간과 종료 시간을 모두 입력해주세요.');
            return;
        }
        const startTimeMs = Date.parse(startInput);
        const endTimeMs = Date.parse(endInput);
        if (Number.isNaN(startTimeMs) || Number.isNaN(endTimeMs)) {
            alert('올바른 날짜 형식을 입력해주세요.');
            return;
        }
        if (startTimeMs > endTimeMs) {
            alert('시작 시간이 종료 시간보다 늦을 수 없습니다.');
            return;
        }
        downloadCsvByTimeRange(startTimeMs, endTimeMs);
    }
    return (_jsxs("div", { style: { width: '100%', height: '100%' }, children: [csvExport && (_jsxs("div", { style: {
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }, children: [_jsx("button", { onClick: handleDownloadVisibleRange, disabled: downloading, style: {
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#2b2f36',
                            border: '1px solid #0ecb81',
                            color: '#0ecb81',
                            borderRadius: '4px',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            opacity: downloading ? 0.6 : 1,
                        }, children: "\uD83D\uDCE5 \uD604\uC7AC \uBC94\uC704 CSV" }), _jsx("button", { onClick: () => setOpenRangePicker((prev) => !prev), disabled: downloading, style: {
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: '#2b2f36',
                            border: '1px solid #f7931e',
                            color: '#f7931e',
                            borderRadius: '4px',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            opacity: downloading ? 0.6 : 1,
                        }, children: openRangePicker ? '❌ 취소' : '📅 기간 지정 다운로드' }), openRangePicker && (_jsxs("div", { style: {
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            marginLeft: '12px',
                            padding: '8px',
                            background: '#1a1d22',
                            borderRadius: '6px',
                            border: '1px solid #2e3238',
                        }, children: [_jsx("input", { type: "datetime-local", value: startInput, onChange: (e) => setStartInput(e.target.value), style: {
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    background: '#2b2f36',
                                    border: '1px solid #2e3238',
                                    color: '#f7f8fa',
                                    borderRadius: '4px',
                                    width: '160px',
                                }, "aria-label": "\uB2E4\uC6B4\uB85C\uB4DC \uC2DC\uC791 \uC2DC\uAC04" }), _jsx("span", { style: { color: '#848e9c', fontWeight: 'bold' }, children: "~" }), _jsx("input", { type: "datetime-local", value: endInput, onChange: (e) => setEndInput(e.target.value), style: {
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    background: '#2b2f36',
                                    border: '1px solid #2e3238',
                                    color: '#f7f8fa',
                                    borderRadius: '4px',
                                    width: '160px',
                                }, "aria-label": "\uB2E4\uC6B4\uB85C\uB4DC \uC885\uB8CC \uC2DC\uAC04" }), _jsx("button", { onClick: handleDownloadByUserInput, disabled: downloading, style: {
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    background: '#0ecb81',
                                    border: 'none',
                                    color: '#131722',
                                    borderRadius: '4px',
                                    cursor: downloading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                }, children: downloading ? '⏳ 다운로드 중...' : '📥 다운로드' })] }))] })), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: sortedData, margin: { top: 10, right: 30, left: 20, bottom: 10 }, onClick: handleChartClick, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#2e3238" }), _jsx(XAxis, { dataKey: xKey, tickFormatter: (value) => {
                                const timeMs = bucketToMs(value);
                                return timeMs == null ? String(value ?? '') : currentFormatter.format(timeMs);
                            }, tick: { fontSize: 11, fill: '#848e9c' }, axisLine: { stroke: '#2e3238' }, tickLine: { stroke: '#2e3238' } }), _jsx(YAxis, { tick: { fontSize: 11, fill: '#848e9c' }, axisLine: { stroke: '#2e3238' }, tickLine: { stroke: '#2e3238' } }), _jsx(Tooltip, { labelFormatter: (value) => {
                                const timeMs = bucketToMs(value);
                                return timeMs == null ? String(value ?? '') : currentFormatter.tooltip(timeMs);
                            }, contentStyle: {
                                backgroundColor: '#131722',
                                border: '1px solid #2e3238',
                                borderRadius: '6px',
                                fontSize: '12px',
                            }, labelStyle: { color: '#f7f8fa', fontWeight: '600' } }), _jsx(Legend, {}), peakLimit && (_jsx(ReferenceLine, { y: peakLimit, stroke: "red" // 빨간색
                            , strokeWidth: 2, strokeDasharray: "5 5" // 점선 스타일 (5px 실선, 5px 공백)
                         })), keys.map((key, index) => (_jsx(Line, { type: "monotone", dataKey: key, stroke: ['#0ecb81', '#f7931e', '#26a69a', '#f6465d', '#9c88ff', '#ff6b6b'][index % 6], strokeWidth: 2.5, dot: { r: 4, strokeWidth: 1 }, activeDot: { r: 6, strokeWidth: 2 }, name: labels[key] || key, connectNulls: false }, key)))] }) })] }));
}
