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

type Preset = '10s' | '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';

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
    '10s': {
        // 초 단위: HH:mm:ss
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        name: '10초',
        rotateLabel: true,
        height: 60,
    },
    '1m': {
        // 1분: HH:mm:ss (show seconds)
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
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
                second: '2-digit',
            }),
        name: '1분',
        rotateLabel: true,
        height: 60,
    },
    '15m': {
        // 15분: HH:mm
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
        name: '15분',
        rotateLabel: true,
        height: 60,
    },
    '1h': {
        // 1시간 (분 간격): HH:mm
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
        name: '1시간 (분)',
        rotateLabel: true,
        height: 60,
    },
    '1d': {
        // 1일: MM/dd HH:mm (or MM/dd)
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        name: '1일',
        rotateLabel: false,
        height: 48,
    },
    '1w': {
        // 1주: MM/dd (weekday)
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                weekday: 'short',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleDateString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
            }),
        name: '1주 (일별)',
        rotateLabel: false,
        height: 48,
    },
    '1mo': {
        // 1달: MM/dd
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleDateString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        name: '1달 (일별)',
        rotateLabel: false,
        height: 48,
    },
} as const;

interface LineChartWrapperProps {
    data: any[];
    keys: string[];
    labels: Record<string, string>;
    xKey?: string;
    // 기존 zoomLevel 유지 가능. 새로 preset을 주면 preset 우선 사용.
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
    zoomLevel = 3,
    preset,
    peakLimit,
    peakLimitLabel,
    onDataPointClick,
    csvExport,
    height = 400,
    colors = ['#0ecb81', '#f7931e', '#f6465d', '#26a69a', '#9c27b0'],
}: LineChartWrapperProps) {
    // 결정 로직: preset 우선, 없으면 zoomLevel -> preset 매핑
    const effectivePreset = useMemo<Preset>(() => {
        if (preset) return preset;
        // fallback 매핑: zoomLevel 0..6 -> presets
        switch (zoomLevel) {
            case 0:
                return '10s';
            case 1:
                return '1m';
            case 2:
                return '15m';
            case 3:
                return '1h';
            case 4:
                return '1d';
            case 5:
                return '1w';
            case 6:
                return '1mo';
            default:
                return '1h';
        }
    }, [preset, zoomLevel]);

    const formatter = useMemo(() => PRESET_FORMATTERS[effectivePreset], [effectivePreset]);

    // Y축 자동 범위 계산
    const yAxisDomain = useMemo(() => {
        if (!data.length || !keys.length) return ['dataMin - 5', 'dataMax + 5'];
        const allValues = data.flatMap((item) =>
            keys.map((key) => Number(item[key])).filter((val) => !isNaN(val) && isFinite(val))
        );
        if (!allValues.length) return ['dataMin - 5', 'dataMax + 5'];
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const range = max - min || Math.abs(max) || 1;
        const padding = range * 0.1;
        return [Math.max(0, min - padding), max + padding];
    }, [data, keys]);

    const xAxisInterval = useMemo(() => {
        if (data.length <= 10) return 0;
        if (data.length <= 20) return 1;
        if (data.length <= 50) return Math.floor(data.length / 10);
        return Math.floor(data.length / 8);
    }, [data.length]);

    const handleClick = useCallback(
        (chartData: any) => {
            if (onDataPointClick && chartData?.activePayload?.[0]?.payload) {
                const payload = chartData.activePayload[0].payload;
                const timeMs = new Date(payload[xKey]).getTime();
                onDataPointClick(payload, timeMs);
            }
        },
        [onDataPointClick, xKey]
    );

    const CustomTooltip = useCallback(
        ({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;
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
                    <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                        {formatter.tooltip(new Date(label).getTime())}
                    </div>
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
                        📊 {formatter.name} • {data.length}개 데이터
                    </div>
                    <CsvDownloader
                        apiPath={csvExport.apiPath}
                        extraParams={csvExport.extraParams}
                        filePrefix={csvExport.filePrefix}
                    />
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} onClick={handleClick} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3e4347" horizontal vertical={false} />

                    <XAxis
                        dataKey={xKey}
                        tickFormatter={(v: any) => {
                            const ms = new Date(v).getTime();
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
                            connectNulls={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 12, fontSize: 11, color: '#8c9196', textAlign: 'center' }}>
                {(['1w', '1mo'] as Preset[]).includes(effectivePreset) && onDataPointClick && (
                    <span>💡 데이터 포인트를 클릭하면 더 자세한 시간 범위로 드릴다운됩니다</span>
                )}
                {(['10s', '1m', '15m', '1h'] as Preset[]).includes(effectivePreset) && (
                    <span>🔄 실시간으로 데이터가 업데이트됩니다</span>
                )}
            </div>
        </div>
    );
}
