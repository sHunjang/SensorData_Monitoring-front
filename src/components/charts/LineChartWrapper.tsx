// src/components/charts/LineChartWrapper.tsx
import React, { useMemo, useCallback } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Legend,
} from 'recharts';
import CsvDownloader from '../common/CsvDownloader';

type Preset = '1day' | '1week' | '1month' | '1year';

const PRESET_FORMATTERS: Record<
    Preset,
    {
        format: (ms: number) => string;
        tooltip: (ms: number) => string;
        name: string;
        rotateLabel?: boolean;
        height?: number;
    }
> = {
    '1day': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        name: '1일 (1분)',
        rotateLabel: true,
        height: 60,
    },
    '1week': {
        format: (ms) => {
            const date = new Date(ms);
            const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            return (
                new Intl.DateTimeFormat('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul',
                })
                    .format(date)
                    .replace(/\. /g, '/')
                    .replace(/\./g, '') + ` (${weekday})`
            );
        },
        tooltip: (ms) => {
            const date = new Date(ms);
            const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
            return (
                new Intl.DateTimeFormat('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(date) + ` (${weekday})`
            );
        },
        name: '1주 (15분)',
        rotateLabel: true,
        height: 70,
    },
    '1month': {
        format: (ms) => {
            const date = new Date(ms);
            return `${date.getDate()}일`;
        },
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        name: '1개월 (1시간)',
        rotateLabel: false,
        height: 40,
    },
    '1year': {
        // ✅ 1년: MM/dd 형식으로 표시
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Seoul',
            })
                .format(new Date(ms))
                .replace(/\. /g, '/')
                .replace(/\./g, ''),
        tooltip: (ms) =>
            new Date(ms).toLocaleDateString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
            }),
        name: '1년 (1일)',
        rotateLabel: true, // ✅ 레이블 회전
        height: 60,
    },
} as const;

interface LineChartWrapperProps {
    data: any[];
    keys: string[];
    labels: Record<string, string>;
    xKey?: string;
    zoomLevel?: number;
    preset?: Preset;
    peakLimit?: number;
    peakLimitLabel?: string;
    onDataPointClick?: (dataPoint: any, timeMs: number) => void;
    csvExport?: {
        apiPath: string;
        extraParams: Record<string, any>;
        filePrefix: string;
    };
    height?: number;
    colors?: string[];
}

export default function LineChartWrapper({
    data,
    keys,
    labels,
    xKey = 'bucket',
    zoomLevel = 0,
    preset,
    peakLimit,
    peakLimitLabel,
    onDataPointClick,
    csvExport,
    height = 400,
    colors = ['#0ecb81', '#f7931e', '#f6465d', '#26a69a', '#9c27b0'],
}: LineChartWrapperProps) {
    const effectivePreset = useMemo<Preset>(() => {
        if (preset) return preset;
        switch (zoomLevel) {
            case 0:
                return '1day';
            case 1:
                return '1week';
            case 2:
                return '1month';
            case 3:
                return '1year';
            default:
                return '1day';
        }
    }, [preset, zoomLevel]);

    const formatter = useMemo(() => PRESET_FORMATTERS[effectivePreset], [effectivePreset]);

    // ✅ Day/Week/Month/Year View일 때 bucket을 timestamp로 변환
    const processedData = useMemo(() => {
        if (['1day', '1week', '1month', '1year'].includes(effectivePreset)) {
            return data.map((d) => ({
                ...d,
                [xKey]: new Date(d[xKey]).getTime(),
            }));
        }
        return data;
    }, [data, effectivePreset, xKey]);

    // ✅ Day/Week/Month/Year View일 때 X축 domain 고정
    const xAxisDomain = useMemo(() => {
        if (processedData.length === 0) return ['auto', 'auto'];

        const firstTimestamp = processedData[0][xKey];
        const firstDate = new Date(firstTimestamp);

        if (isNaN(firstDate.getTime())) {
            console.error('[LineChartWrapper] Invalid date:', firstTimestamp);
            return ['auto', 'auto'];
        }

        const year = firstDate.getFullYear();
        const month = firstDate.getMonth();
        const day = firstDate.getDate();

        if (effectivePreset === '1day') {
            const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
            const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
            return [startOfDay.getTime(), endOfDay.getTime()];
        } else if (effectivePreset === '1week') {
            const dayOfWeek = firstDate.getDay();
            const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(year, month, day + daysToMonday, 0, 0, 0, 0);
            const endOfWeek = new Date(
                startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999
            );
            return [startOfWeek.getTime(), endOfWeek.getTime()];
        } else if (effectivePreset === '1month') {
            const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
            const endOfMonth = new Date(year, month, 30, 23, 59, 59, 999);
            return [startOfMonth.getTime(), endOfMonth.getTime()];
        } else if (effectivePreset === '1year') {
            // ✅ 1년: 1월 1일 ~ 12월 31일
            const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            return [startOfYear.getTime(), endOfYear.getTime()];
        }

        return ['auto', 'auto'];
    }, [effectivePreset, processedData, xKey]);

    // ✅ Day/Week/Month/Year View일 때 X축 ticks 고정
    const xAxisTicks = useMemo(() => {
        if (processedData.length === 0) return undefined;

        const firstTimestamp = processedData[0][xKey];
        const firstDate = new Date(firstTimestamp);

        if (isNaN(firstDate.getTime())) {
            return undefined;
        }

        const year = firstDate.getFullYear();
        const month = firstDate.getMonth();
        const day = firstDate.getDate();

        if (effectivePreset === '1day') {
            const ticks: number[] = [];
            for (let hour = 0; hour < 24; hour += 3) {
                ticks.push(new Date(year, month, day, hour, 0, 0, 0).getTime());
            }
            return ticks;
        } else if (effectivePreset === '1week') {
            const dayOfWeek = firstDate.getDay();
            const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(year, month, day + daysToMonday, 0, 0, 0, 0);

            const ticks: number[] = [];
            for (let i = 0; i <= 6; i++) {
                ticks.push(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000).getTime());
            }
            return ticks;
        } else if (effectivePreset === '1month') {
            const ticks: number[] = [];
            for (let d = 1; d <= 30; d += 5) {
                ticks.push(new Date(year, month, d, 0, 0, 0, 0).getTime());
            }
            return ticks;
        } else if (effectivePreset === '1year') {
            // ✅ 1년: 매월 1일 (1월 1일, 2월 1일, ..., 12월 1일)
            const ticks: number[] = [];
            for (let m = 0; m < 12; m++) {
                ticks.push(new Date(year, m, 1, 0, 0, 0, 0).getTime());
            }
            return ticks;
        }

        return undefined;
    }, [effectivePreset, processedData, xKey]);

    const yAxisDomain = useMemo(() => {
        if (!processedData.length || !keys.length) return ['dataMin - 5', 'dataMax + 5'];
        const allValues = processedData
            .flatMap((item) => keys.map((key) => Number(item[key])))
            .filter((val) => !isNaN(val) && isFinite(val));
        if (!allValues.length) return ['dataMin - 5', 'dataMax + 5'];
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const range = max - min || Math.abs(max) || 1;
        const padding = range * 0.1;
        return [Math.max(0, min - padding), max + padding];
    }, [processedData, keys]);

    const xAxisInterval = useMemo(() => {
        if (['1day', '1week', '1month', '1year'].includes(effectivePreset)) return 0;
        if (processedData.length <= 10) return 0;
        if (processedData.length <= 20) return 1;
        if (processedData.length <= 50) return Math.floor(processedData.length / 10);
        return Math.floor(processedData.length / 8);
    }, [effectivePreset, processedData.length]);

    const handleClick = useCallback(
        (chartData: any) => {
            if (onDataPointClick && chartData?.activePayload?.[0]?.payload) {
                const payload = chartData.activePayload[0].payload;
                const timeMs = typeof payload[xKey] === 'number' ? payload[xKey] : new Date(payload[xKey]).getTime();
                onDataPointClick(payload, timeMs);
            }
        },
        [onDataPointClick, xKey]
    );

    const CustomTooltip = useCallback(
        ({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;
            const labelMs = typeof label === 'number' ? label : new Date(label).getTime();
            return (
                <div
                    style={{
                        backgroundColor: '#2b2f36',
                        border: '1px solid #3e4347',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#f7f8fa',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                >
                    <div style={{ marginBottom: '8px', fontWeight: 600 }}>{formatter.tooltip(labelMs)}</div>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ color: entry.color, marginBottom: '4px' }}>
                            <span style={{ marginRight: '8px' }}>●</span>
                            <span>{labels[entry.dataKey] || entry.dataKey}: </span>
                            <strong>
                                {Number(entry.value).toLocaleString('ko-KR', {
                                    maximumFractionDigits: 2,
                                })}
                            </strong>
                        </div>
                    ))}
                </div>
            );
        },
        [formatter, labels]
    );

    const axisRotate = formatter.rotateLabel ?? false;
    const axisHeight = formatter.height ?? (axisRotate ? 60 : 40);

    return (
        <div style={{ width: '100%', height }}>
            {csvExport && (
                <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
                >
                    <div style={{ color: '#f7f8fa', fontSize: 14, fontWeight: 600 }}>
                        📊 {formatter.name} • {processedData.length}개 데이터
                    </div>
                    <CsvDownloader
                        apiPath={csvExport.apiPath}
                        extraParams={csvExport.extraParams}
                        filePrefix={csvExport.filePrefix}
                    />
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={processedData}
                    onClick={handleClick}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3e4347" horizontal vertical={false} />

                    <XAxis
                        dataKey={xKey}
                        domain={xAxisDomain}
                        ticks={xAxisTicks}
                        type={['1day', '1week', '1month', '1year'].includes(effectivePreset) ? 'number' : 'category'}
                        scale={['1day', '1week', '1month', '1year'].includes(effectivePreset) ? 'time' : undefined}
                        tickFormatter={(v: any) => {
                            const ms = typeof v === 'number' ? v : new Date(v).getTime();
                            return formatter.format(ms);
                        }}
                        tick={{ fontSize: 11, fill: '#b7bcc8' }}
                        axisLine={{ stroke: '#3e4347' }}
                        tickLine={{ stroke: '#3e4347' }}
                        interval={xAxisInterval}
                        angle={axisRotate ? -45 : 0}
                        textAnchor={axisRotate ? 'end' : 'middle'}
                        height={axisHeight}
                    />

                    <YAxis
                        domain={yAxisDomain}
                        tick={{ fontSize: 11, fill: '#b7bcc8' }}
                        axisLine={{ stroke: '#3e4347' }}
                        tickLine={{ stroke: '#3e4347' }}
                        tickFormatter={(value) =>
                            Number(value).toLocaleString('ko-KR', {
                                maximumFractionDigits: 1,
                            })
                        }
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#f7f8fa' }} />}

                    {peakLimit && (
                        <ReferenceLine
                            y={peakLimit}
                            stroke="#f6465d"
                            strokeDasharray="8 8"
                            strokeWidth={2}
                            label={{
                                value: peakLimitLabel || `임계값: ${peakLimit}`,
                                position: 'right',
                                style: { fill: '#f6465d', fontSize: 11, fontWeight: 600 },
                            }}
                        />
                    )}

                    {keys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: colors[index % colors.length], fill: '#fff' }}
                            name={labels[key] || key}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 12, fontSize: 11, color: '#8c9196', textAlign: 'center' }}>
                {effectivePreset === '1day' && <span>📅 00:00 ~ 23:59 고정 범위 (1분 해상도)</span>}
                {effectivePreset === '1week' && <span>📅 월요일 ~ 일요일 고정 범위 (15분 해상도)</span>}
                {effectivePreset === '1month' && <span>📅 1일 ~ 30일 고정 범위 (1시간 해상도)</span>}
                {effectivePreset === '1year' && <span>📅 1월 1일 ~ 12월 31일 고정 범위 (1일 해상도)</span>}
            </div>
        </div>
    );
}
