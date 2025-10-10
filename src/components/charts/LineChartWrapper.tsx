/**
 * 라인 차트 래퍼 컴포넌트
 *
 * Recharts 기반 시계열 데이터 시각화
 * - 다양한 시간 단위 지원 (1m, 15m, 1h, 1d, 1w, 1mo, 6mo, 1y)
 * - 자동 Y축 범위 계산
 * - CSV 다운로드 기능
 * - 툴팁 및 범례
 * - Responsive 디자인
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
import { CsvDownloader } from '../common/CsvDownloader';
import { SERIES_LABELS } from '@/constants/labels';

// ========================================
// 타입 정의
// ========================================

/**
 * Preset 타입 (시간 단위)
 */
type Preset = '1m' | '15m' | '1h' | '1d' | '1w' | '1mo' | '6mo' | '1y';

/**
 * Preset별 포맷터 설정
 */
interface PresetFormatter {
    /**
     * X축 라벨 포맷
     */
    format: (ms: number) => string;

    /**
     * 툴팁 포맷
     */
    tooltip: (ms: number) => string;

    /**
     * Preset 이름
     */
    name: string;

    /**
     * X축 라벨 회전 여부
     */
    rotateLabel?: boolean;

    /**
     * X축 높이
     */
    height?: number;
}

/**
 * LineChartWrapper Props
 */
interface LineChartWrapperProps {
    data: any[];
    keys: string[];
    labels?: Record<string, string>;
    xKey?: string;
    preset?: Preset; // ✅ 'Preset' 타입
    peakLimit?: number;
    peakLimitLabel?: string;
    onDataPointClick?: (dataPoint: any, timeMs: number) => void;
    csvExport?: {
        filename: string; // ✅ 필수
        headers: string[]; // ✅ 필수
    };
    height?: number;
    colors?: string[];
}

// ========================================
// Preset 포맷터 설정
// ========================================

const PRESET_FORMATTERS: Record<Preset, PresetFormatter> = {
    // 1분 (초 단위 표시)
    '1m': {
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

    // 15분 (분 단위 표시)
    '15m': {
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

    // 1시간 (시간 단위 표시)
    '1h': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
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
        name: '1시간',
        rotateLabel: true,
        height: 60,
    },

    // 1일 (일 단위 표시)
    '1d': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: 'short',
                day: 'numeric',
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
        height: 40,
    },

    // 1주 (주 단위 표시)
    '1w': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        name: '1주',
        rotateLabel: false,
        height: 40,
    },

    // 1개월 (월/일 표시)
    '1mo': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        name: '1개월',
        rotateLabel: false,
        height: 40,
    },

    // 6개월 (월 단위 표시)
    '6mo': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'short',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
            }),
        name: '6개월',
        rotateLabel: false,
        height: 40,
    },

    // 1년 (년/월 표시)
    '1y': {
        format: (ms) =>
            new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'short',
                timeZone: 'Asia/Seoul',
            }).format(new Date(ms)),
        tooltip: (ms) =>
            new Date(ms).toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: 'long',
            }),
        name: '1년',
        rotateLabel: false,
        height: 40,
    },
} as const;

// ========================================
// 컴포넌트
// ========================================

export const LineChartWrapper: React.FC<LineChartWrapperProps> = ({
    data,
    keys,
    labels = SERIES_LABELS,
    xKey = 'time',
    preset = '15m',
    peakLimit,
    peakLimitLabel,
    onDataPointClick,
    csvExport,
    height = 400,
    colors = ['#0ecb81', '#f7931e', '#f6465d', '#26a69a', '#9c27b0', '#00bcd4', '#4caf50'],
}) => {
    // Formatter 선택
    const formatter = useMemo(() => PRESET_FORMATTERS[preset], [preset]);

    /**
     * 데이터 전처리: 시간 파싱
     */
    const processedData = useMemo(() => {
        return data.map((d) => {
            const bucketValue = d[xKey];
            let timestamp: number;

            if (typeof bucketValue === 'string') {
                // ISO 8601 형식 파싱
                timestamp = new Date(bucketValue).getTime();

                // Invalid Date 체크
                if (isNaN(timestamp)) {
                    console.error('Failed to parse date:', bucketValue);
                    timestamp = Date.now();
                }
            } else if (bucketValue instanceof Date) {
                timestamp = bucketValue.getTime();
            } else if (typeof bucketValue === 'number') {
                timestamp = bucketValue;
            } else {
                console.warn('Invalid date format:', bucketValue);
                timestamp = Date.now();
            }

            return {
                ...d,
                [xKey]: timestamp,
            };
        });
    }, [data, xKey]);

    /**
     * Y축 자동 범위 계산
     */
    const yAxisDomain = useMemo(() => {
        if (!processedData.length || !keys.length) {
            return ['dataMin - 5', 'dataMax + 5'];
        }

        const allValues = processedData.flatMap((item) =>
            keys.map((key) => Number(item[key])).filter((val) => !isNaN(val) && isFinite(val))
        );

        if (!allValues.length) {
            return ['dataMin - 5', 'dataMax + 5'];
        }

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const range = max - min || Math.abs(max) || 1;
        const padding = range * 0.1;

        return [Math.max(0, min - padding), max + padding];
    }, [processedData, keys]);

    /**
     * X축 간격 계산
     */
    const xAxisInterval = useMemo(() => {
        if (processedData.length <= 10) return 0;
        if (processedData.length <= 20) return 1;
        if (processedData.length <= 50) return Math.floor(processedData.length / 10);
        return Math.floor(processedData.length / 8);
    }, [processedData.length]);

    /**
     * 차트 클릭 핸들러
     */
    const handleClick = useCallback(
        (chartData: any) => {
            if (onDataPointClick && chartData?.activePayload?.[0]?.payload) {
                const payload = chartData.activePayload[0].payload;
                const timeMs = payload[xKey];
                onDataPointClick(payload, timeMs);
            }
        },
        [onDataPointClick, xKey]
    );

    /**
     * 커스텀 툴팁
     */
    const CustomTooltip = useCallback(
        ({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;

            return (
                <div
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                    }}
                >
                    <div style={{ color: '#fff', marginBottom: '8px', fontSize: '12px' }}>
                        {formatter.tooltip(label)}
                    </div>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ color: entry.color, fontSize: '13px', marginBottom: '4px' }}>
                            {labels[entry.dataKey] || entry.dataKey}:{' '}
                            {Number(entry.value).toLocaleString('ko-KR', {
                                maximumFractionDigits: 2,
                            })}
                        </div>
                    ))}
                </div>
            );
        },
        [formatter, labels]
    );

    const axisRotate = formatter.rotateLabel ?? false;
    const axisHeight = formatter.height ?? (axisRotate ? 60 : 40);

    // Dot 표시 설정
    const showDot = processedData.length <= 50;
    const dotRadius = processedData.length <= 5 ? 6 : processedData.length <= 20 ? 5 : 4;

    return (
        <div style={{ width: '100%' }}>
            {/* CSV 다운로드 및 정보 */}
            {csvExport && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#999', fontSize: '14px' }}>
                        📊 {formatter.name} • {processedData.length}개 데이터
                    </span>
                    <CsvDownloader
                        data={processedData}
                        headers={csvExport.headers}
                        filename={csvExport.filename}
                        buttonText="CSV 다운로드"
                    />
                </div>
            )}

            {/* 차트 */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={processedData}
                    onClick={handleClick}
                    margin={{ top: 10, right: 30, left: 0, bottom: axisHeight - 40 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#3e4347" />

                    {/* X축 (시간) */}
                    <XAxis
                        dataKey={xKey}
                        tickFormatter={(v) => {
                            const ms = typeof v === 'number' ? v : new Date(v).getTime();
                            if (isNaN(ms)) {
                                console.error('Invalid timestamp for XAxis:', v);
                                return '--';
                            }
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

                    {/* Y축 */}
                    <YAxis
                        domain={yAxisDomain}
                        tickFormatter={(value) =>
                            Number(value).toLocaleString('ko-KR', {
                                maximumFractionDigits: 1,
                            })
                        }
                        tick={{ fontSize: 11, fill: '#b7bcc8' }}
                        axisLine={{ stroke: '#3e4347' }}
                        tickLine={{ stroke: '#3e4347' }}
                    />

                    {/* 툴팁 */}
                    <Tooltip content={<CustomTooltip />} />

                    {/* 범례 (키가 2개 이상일 때만) */}
                    {keys.length > 1 && (
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                            formatter={(value: string) => labels[value] || value}
                        />
                    )}

                    {/* 피크 제한선 */}
                    {peakLimit && (
                        <ReferenceLine
                            y={peakLimit}
                            stroke="#f6465d"
                            strokeDasharray="5 5"
                            label={{
                                value: peakLimitLabel || `제한: ${peakLimit}`,
                                fill: '#f6465d',
                                fontSize: 12,
                            }}
                        />
                    )}

                    {/* 데이터 라인 */}
                    {keys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={showDot ? { r: dotRadius } : false}
                            activeDot={{ r: 6 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* 안내 메시지 */}
            {onDataPointClick && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                    💡 데이터 포인트를 클릭하면 상세 정보를 확인할 수 있습니다
                </div>
            )}
        </div>
    );
};
