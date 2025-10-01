// src/components/charts/LineChartWrapper.tsx
/**
 * LineChartWrapper - 공통 라인 차트 래퍼 컴포넌트
 *
 * 주요 기능:
 * - 4단계 줌 레벨별 X축 라벨 포맷터 (1시간, 1일, 1주일, 1달)
 * - Y축 자동 범위 조정 (데이터 값에 맞춰)
 * - 피크 라임 (임계값) 표시
 * - 데이터 포인트 클릭 시 드릴다운
 * - CSV 다운로드 기능
 * - 반응형 디자인 지원
 */

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

// 줌 레벨별 X축 포맷터 설정
const ZOOM_FORMATTERS = {
    0: {
        // 1시간 (1분 간격): HH:mm 형태
        format: (ms: number) =>
            new Intl.DateTimeFormat('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms: number) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            }),
        name: '1시간 (1분 간격)',
    },
    1: {
        // 1일 (실시간): MM/dd HH:mm 형태
        format: (ms: number) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms: number) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        name: '1일 (실시간)',
    },
    2: {
        // 🔧 핵심 수정: 1주일 (일별 평균): MM/dd (요일) 형태
        format: (ms: number) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                weekday: 'short',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms: number) =>
            new Date(ms).toLocaleDateString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
            }),
        name: '1주일 (일별 평균)',
    },
    3: {
        // 1달 (일별 평균): MM/dd 형태
        format: (ms: number) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms: number) =>
            new Date(ms).toLocaleDateString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        name: '1달 (일별 평균)',
    },
} as const;

interface LineChartWrapperProps {
    data: any[];
    keys: string[];
    labels: Record<string, string>;
    xKey?: string;
    zoomLevel: number;
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
    zoomLevel,
    peakLimit,
    peakLimitLabel,
    onDataPointClick,
    csvExport,
    height = 400,
    colors = ['#0ecb81', '#f7931e', '#f6465d', '#26a69a', '#9c27b0'],
}: LineChartWrapperProps) {
    // 줌 레벨별 포맷터 가져오기
    const formatter = useMemo(() => {
        const level = zoomLevel as keyof typeof ZOOM_FORMATTERS;
        return ZOOM_FORMATTERS[level] || ZOOM_FORMATTERS[1];
    }, [zoomLevel]);

    // Y축 자동 범위 계산
    const yAxisDomain = useMemo(() => {
        if (!data.length || !keys.length) return ['dataMin - 5', 'dataMax + 5'];

        const allValues = data.flatMap((item) =>
            keys.map((key) => Number(item[key])).filter((val) => !isNaN(val) && isFinite(val))
        );

        if (!allValues.length) return ['dataMin - 5', 'dataMax + 5'];

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const range = max - min;
        const padding = range * 0.1; // 10% 여백

        return [
            Math.max(0, min - padding), // 최소값은 0 이상
            max + padding,
        ];
    }, [data, keys]);

    // X축 틱 간격 조정 (데이터 양에 따라)
    const xAxisInterval = useMemo(() => {
        if (data.length <= 10) return 0; // 모든 틱 표시
        if (data.length <= 20) return 1; // 2개 걸러서 표시
        if (data.length <= 50) return Math.floor(data.length / 10); // 10개 정도 표시
        return Math.floor(data.length / 8); // 8개 정도 표시
    }, [data.length]);

    // 차트 클릭 핸들러
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

    // 커스텀 툴팁
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
                    <div style={{ marginBottom: '8px', fontWeight: '600' }}>
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

    return (
        <div style={{ width: '100%', height }}>
            {/* 차트 헤더 - CSV 다운로드 버튼 */}
            {csvExport && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    }}
                >
                    <div
                        style={{
                            color: '#f7f8fa',
                            fontSize: '14px',
                            fontWeight: '600',
                        }}
                    >
                        📊 {formatter.name} • {data.length}개 데이터
                    </div>
                    <CsvDownloader
                        apiPath={csvExport.apiPath}
                        extraParams={csvExport.extraParams}
                        filePrefix={csvExport.filePrefix}
                    />
                </div>
            )}

            {/* 메인 차트 */}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} onClick={handleClick} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3e4347" horizontal={true} vertical={false} />

                    <XAxis
                        dataKey={xKey}
                        tickFormatter={formatter.format}
                        tick={{ fontSize: 11, fill: '#b7bcc8' }}
                        axisLine={{ stroke: '#3e4347' }}
                        tickLine={{ stroke: '#3e4347' }}
                        interval={xAxisInterval}
                        angle={zoomLevel <= 1 ? -45 : 0} // 1시간/1일은 라벨 회전
                        textAnchor={zoomLevel <= 1 ? 'end' : 'middle'}
                        height={zoomLevel <= 1 ? 60 : 40}
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

                    {keys.length > 1 && (
                        <Legend
                            wrapperStyle={{
                                fontSize: '12px',
                                color: '#f7f8fa',
                            }}
                        />
                    )}

                    {/* 피크 라임 (임계값) 표시 */}
                    {peakLimit && (
                        <ReferenceLine
                            y={peakLimit}
                            stroke="#f6465d"
                            strokeDasharray="8 8"
                            strokeWidth={2}
                            label={{
                                value: peakLimitLabel || `임계값: ${peakLimit}`,
                                position: 'right',
                                style: { fill: '#f6465d', fontSize: '11px', fontWeight: '600' },
                            }}
                        />
                    )}

                    {/* 데이터 라인들 */}
                    {keys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 0 }}
                            activeDot={{
                                r: 5,
                                strokeWidth: 2,
                                stroke: colors[index % colors.length],
                                fill: '#fff',
                            }}
                            name={labels[key] || key}
                            connectNulls={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* 차트 하단 정보 */}
            <div
                style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: '#8c9196',
                    textAlign: 'center',
                }}
            >
                {zoomLevel >= 2 && onDataPointClick && (
                    <span>💡 데이터 포인트를 클릭하면 더 자세한 시간 범위로 드릴다운됩니다</span>
                )}
                {zoomLevel <= 1 && <span>🔄 실시간으로 데이터가 업데이트됩니다</span>}
            </div>
        </div>
    );
}
