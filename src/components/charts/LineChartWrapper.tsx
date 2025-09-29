// src/components/charts/LineChartWrapper.tsx

/**
 * LineChartWrapper.tsx - 피크선 기능이 추가된 차트 컴포넌트 (에러 수정됨)
 *
 * 🔧 수정사항:
 * - ReferenceLine label position 에러 해결
 * - 라벨 스타일 간소화
 * - TypeScript 타입 안전성 개선
 */

import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    ReferenceLine, // 🆕 피크선을 위한 ReferenceLine 추가
} from 'recharts';

// 🔧 CSV 다운로드 설정 타입
type CsvExportSpec = {
    apiPath: string; // API 엔드포인트 경로
    extraParams?: Record<string, any>; // 추가 파라미터 (device_id 등)
    filePrefix?: string; // 파일명 접두사
    maxPoints?: number; // 최대 포인트 수 제한
};

// 🎨 LineChartWrapper Props 타입 정의
type Props = {
    data: any[]; // 차트 데이터 배열
    keys: string[]; // 표시할 데이터 키 배열
    labels: Record<string, string>; // 키별 사용자 친화적 라벨
    xKey?: string; // X축 키 (기본: bucket)
    csvExport?: CsvExportSpec | null; // CSV 다운로드 설정
    peakLimit?: number; // 🆕 피크 기준값
    peakLimitLabel?: string; // 🆕 피크선 라벨
};

/**
 * 🔗 URL 쿼리 스트링 생성 헬퍼 함수
 * 객체를 URL 쿼리 파라미터로 변환
 */
function toQueryString(params: Record<string, any>) {
    const esc = encodeURIComponent;
    const parts: string[] = [];
    for (const k of Object.keys(params)) {
        const v = params[k];
        if (v == null) continue;
        parts.push(`${esc(k)}=${esc(String(v))}`);
    }
    return parts.length ? '?' + parts.join('&') : '';
}

/**
 * 🎨 LineChartWrapper 메인 컴포넌트
 * 데이터 차트 + 피크선 + CSV 다운로드 기능
 */
export default function LineChartWrapper({
    data,
    keys,
    labels,
    xKey = 'bucket', // 기본 X축: 시간 bucket
    csvExport,
    peakLimit, // 🆕 피크 기준값
    peakLimitLabel, // 🆕 피크선 라벨
}: Props) {
    // 📄 CSV 다운로드 상태 관리
    const [csvLoading, setCsvLoading] = useState(false);
    const [visibleRange, setVisibleRange] = useState<{ start: string; end: string } | null>(null);

    /**
     * ⏰ X축 시간 표시 포맷터
     * ISO 시간 문자열 또는 타임스탬프를 사용자 친화적 형태로 변환
     */
    const fmtTick = (val: any) => {
        if (!val) return '';

        // ISO 문자열인 경우 Date 파싱
        if (typeof val === 'string') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
        }

        // 숫자 타임스탬프인 경우
        if (typeof val === 'number') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
        }

        return String(val);
    };

    /**
     * 🎨 툴팁 라벨 포맷터 (시간 표시용)
     */
    const fmtTooltipLabel = (val: any) => {
        if (!val) return '';

        if (typeof val === 'string') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleString('ko-KR');
            }
        }

        if (typeof val === 'number') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleString('ko-KR');
            }
        }

        return String(val);
    };

    /**
     * 📄 CSV 다운로드 함수 (기존 기능 유지)
     * API를 통해 전체 데이터를 CSV로 다운로드
     */
    const handleCsvDownload = async (useVisibleRange = false) => {
        if (!csvExport) return;

        try {
            setCsvLoading(true);

            // 📊 API 파라미터 구성
            const params: Record<string, any> = {
                ...(csvExport.extraParams || {}),
                max_points: csvExport.maxPoints || 5000,
                format: 'csv',
            };

            // 🔍 보이는 범위만 다운로드하는 경우
            if (useVisibleRange && visibleRange) {
                params.start = visibleRange.start;
                params.end = visibleRange.end;
            }

            // 🔗 API 호출 URL 생성
            const url = csvExport.apiPath + toQueryString(params);

            // 📁 파일 다운로드 실행
            const link = document.createElement('a');
            link.href = url;
            link.download = `${csvExport.filePrefix || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('CSV 다운로드 실패:', error);
            alert('CSV 다운로드에 실패했습니다.');
        } finally {
            setCsvLoading(false);
        }
    };

    // 🎨 차트 색상 배열 (다중 라인용)
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* 📄 CSV 다운로드 버튼들 (우상단) */}
            {csvExport && (
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        display: 'flex',
                        gap: 8,
                    }}
                >
                    <button
                        onClick={() => handleCsvDownload(false)}
                        disabled={csvLoading}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: csvLoading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {csvLoading ? '다운로드 중...' : '📄 CSV 다운로드'}
                    </button>

                    {visibleRange && (
                        <button
                            onClick={() => handleCsvDownload(true)}
                            disabled={csvLoading}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #007bff',
                                borderRadius: '4px',
                                background: '#007bff',
                                color: 'white',
                                cursor: csvLoading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            📊 보이는 범위만
                        </button>
                    )}
                </div>
            )}

            {/* 📈 메인 차트 영역 */}
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    {/* 🔲 격자 */}
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* 📅 X축 (시간) */}
                    <XAxis dataKey={xKey} tickFormatter={fmtTick} minTickGap={24} />

                    {/* 📊 Y축 (값) */}
                    <YAxis allowDecimals />

                    {/* 🖱️ 툴팁 */}
                    <Tooltip
                        labelFormatter={fmtTooltipLabel}
                        formatter={(value: any, name: string) => [
                            typeof value === 'number' ? value.toFixed(3) : value,
                            labels[name] || name,
                        ]}
                    />

                    {/* 🏷️ 범례 */}
                    <Legend />

                    {/* 🚨 피크 기준선 (수정됨 - 에러 해결) */}
                    {peakLimit != null && (
                        <ReferenceLine
                            y={peakLimit} // Y축 값에 피크선 표시
                            stroke="red" // 빨간색
                            strokeWidth={2} // 선 두께
                            strokeDasharray="5 5" // 점선 스타일 (5px 실선, 5px 공백)
                            // label={peakLimitLabel || `피크: ${peakLimit}`} // 🔧 간단한 라벨로 수정
                        />
                    )}

                    {/* 📈 데이터 라인들 */}
                    {keys.map((k, index) => (
                        <Line
                            key={k}
                            type="monotone" // 부드러운 곡선
                            dataKey={k} // 데이터 키
                            name={labels[k] ?? k} // 범례에 표시될 이름
                            stroke={colors[index % colors.length]} // 색상 순환
                            strokeWidth={2} // 선 두께
                            dot={false} // 점 표시 안함 (성능)
                            isAnimationActive={true} // 애니메이션 활성화
                            animationDuration={200} // 애니메이션 시간
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
