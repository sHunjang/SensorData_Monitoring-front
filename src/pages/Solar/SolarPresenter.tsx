// src/pages/Solar/SolarPresenter.tsx

/**
 * SolarPresenter.tsx - 태양광센서 모니터링 UI (드릴다운 시스템)
 *
 * 🎨 디자인 특징:
 * - 다크 테마 태양광센서 전용 스타일
 * - 일사량 실시간 표시를 태양광 패널처럼 시각화
 * - 드릴다운 차트: 클릭으로 더 세부적인 시간 범위로 이동
 * - 6개 통계 카드: 현재/평균/최대/최소/개수/임계값상태
 * - 태양광 임계값 설정 및 시각화
 * - 활동 로그 (태양광센서 전용)
 */

import React from 'react';
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';

/**
 * 🔧 Props 타입 정의 (SolarContainer와 연동)
 */
type Props = {
    // 장치 및 데이터 선택
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: string;
    setColumn: (column: string) => void;

    // 줌 컨트롤
    zoomLevel: number;
    zoomLabel: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;

    // 차트 인터랙션
    onDataPointClick?: (dataPoint: any, timeMs: number) => void;
    onManualRefresh: () => void;

    // 데이터와 상태
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];

    // 태양광 임계값
    peakLimits: Record<string, number>;
    setPeakLimits: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export default function SolarPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    column,
    setColumn,
    zoomLevel,
    zoomLabel,
    onZoomIn,
    onZoomOut,
    canZoomIn,
    canZoomOut,
    onDataPointClick,
    onManualRefresh,
    data,
    stats,
    loading,
    error,
    logs,
    peakLimits,
    setPeakLimits,
}: Props) {
    // 🔄 로딩 및 에러 상태 처리
    if (loading) return <Loading />;
    if (error) return <Error msg={error} />;

    // ============= 태양광센서 실시간 값 및 변화량 계산 =============

    const lastDataPoint = data?.length ? data[data.length - 1] : null;
    const currentValue = lastDataPoint?.[column] ?? 0;
    const previousValue = data?.length > 1 ? data[data.length - 2]?.[column] ?? 0 : 0;

    const valueChange = currentValue - previousValue;
    const changePercent = previousValue ? ((valueChange / previousValue) * 100).toFixed(2) : '0.00';

    // 🎯 현재 컬럼의 태양광 임계값
    const currentPeakLimit = peakLimits[column];

    // 🏷️ 태양광센서 컬럼별 한글 라벨 정의
    const columnLabels: Record<string, string> = {
        solar: '일사량 (W/m²)',
    };

    // 🏷️ 태양광센서 컬럼별 단위 정의
    const unitLabels: Record<string, string> = {
        solar: 'W/m²',
    };

    /**
     * ☀️ 태양광센서 상태 판정 함수
     */
    const getSolarStatus = (value: number, columnType: string) => {
        switch (columnType) {
            case 'solar':
                if (value >= 1000) return { text: '강한일사', color: '#f7931e', icon: '☀️' };
                if (value >= 800) return { text: '보통일사', color: '#0ecb81', icon: '🌤️' };
                if (value >= 400) return { text: '약한일사', color: '#26a69a', icon: '⛅' };
                if (value >= 100) return { text: '흐림', color: '#848e9c', icon: '☁️' };
                return { text: '야간/차단', color: '#2e3238', icon: '🌙' };
            default:
                return { text: '측정중', color: '#0ecb81', icon: '📊' };
        }
    };

    /**
     * 🚨 태양광 임계값 업데이트 함수
     */
    const handlePeakLimitChange = (inputValue: string) => {
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue) && numericValue > 0) {
            setPeakLimits((prev) => ({
                ...prev,
                [column]: numericValue,
            }));
        }
    };

    /**
     * 🗑️ 태양광 임계값 제거 함수
     */
    const handlePeakLimitRemove = () => {
        setPeakLimits((prev) => {
            const updated = { ...prev };
            delete updated[column];
            return updated;
        });
    };

    const solarStatus = getSolarStatus(currentValue, column);

    // ============= 태양광센서 UI 렌더링 =============

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* ============= 태양광센서 헤더 ============= */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>☀️ SOL-{deviceId}</h1>
                        <div className={styles.subtitle}>태양광 모니터링 • {zoomLabel} 범위</div>
                    </div>

                    <div className={styles.priceInfo}>
                        <h2 className={styles.currentPrice}>
                            {currentValue.toFixed(0)} {unitLabels[column]}
                        </h2>
                        <div className={`${styles.priceChange} ${valueChange < 0 ? styles.priceChangeNegative : ''}`}>
                            <span>{valueChange >= 0 ? '📈' : '📉'}</span>
                            <span>{changePercent}%</span>
                            <span>
                                ({valueChange >= 0 ? '+' : ''}
                                {valueChange.toFixed(0)})
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============= 태양광센서 컨트롤 패널 ============= */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        {/* 태양광센서 장치 선택 */}
                        <div className={styles.controlGroup}>
                            <label>태양광센서</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        태양광 {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 태양광 측정 항목 선택 */}
                        <div className={styles.controlGroup}>
                            <label>측정 항목</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value)}>
                                <option value="solar">☀️ 일사량 (W/m²)</option>
                            </select>
                        </div>

                        {/* 줌 컨트롤 */}
                        <div className={styles.controlGroup}>
                            <label>🔍 시간 범위</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={onZoomIn}
                                    disabled={!canZoomIn}
                                    style={{
                                        flex: 1,
                                        opacity: canZoomIn ? 1 : 0.5,
                                        cursor: canZoomIn ? 'pointer' : 'not-allowed',
                                        padding: '6px 8px',
                                        fontSize: '11px',
                                    }}
                                    title={canZoomIn ? '더 세부적인 시간으로 확대' : '최대 확대됨'}
                                >
                                    🔍+ 확대
                                </button>
                                <button
                                    onClick={onZoomOut}
                                    disabled={!canZoomOut}
                                    style={{
                                        flex: 1,
                                        opacity: canZoomOut ? 1 : 0.5,
                                        cursor: canZoomOut ? 'pointer' : 'not-allowed',
                                        padding: '6px 8px',
                                        fontSize: '11px',
                                    }}
                                    title={canZoomOut ? '더 넓은 시간으로 축소' : '최대 축소됨'}
                                >
                                    🔍- 축소
                                </button>
                            </div>
                        </div>

                        {/* 현재 시간 범위 표시 */}
                        <div className={styles.controlGroup}>
                            <label>📊 현재 보기</label>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: '#2b2f36',
                                    border: `2px solid ${zoomLevel <= 1 ? '#f7931e' : '#26a69a'}`,
                                    borderRadius: '4px',
                                    color: zoomLevel <= 1 ? '#f7931e' : '#26a69a',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                }}
                            >
                                {zoomLevel <= 1 && <span>🔴</span>}
                                📅 {zoomLabel}
                                {zoomLevel <= 1 && <span>(실시간)</span>}
                            </div>
                        </div>

                        {/* 태양광 임계값 설정 */}
                        <div className={styles.controlGroup}>
                            <label>🚨 일사량 임계값 ({unitLabels[column]})</label>
                            <input
                                type="number"
                                step="10"
                                value={currentPeakLimit || ''}
                                onChange={(e) => handlePeakLimitChange(e.target.value)}
                                placeholder="일사량 임계값"
                                style={{
                                    background: '#2b2f36',
                                    border: '1px solid #2e3238',
                                    color: '#f7f8fa',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                }}
                            />
                        </div>

                        {/* 새로고침 및 임계값 제거 버튼 */}
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={onManualRefresh} style={{ flex: 1, fontSize: '11px' }}>
                                    🔄 새로고침
                                </button>
                                {currentPeakLimit && (
                                    <button
                                        onClick={handlePeakLimitRemove}
                                        style={{
                                            flex: 1,
                                            background: '#f6465d',
                                            borderColor: '#f6465d',
                                            fontSize: '11px',
                                        }}
                                    >
                                        🗑️ 제거
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============= 태양광센서 드릴다운 차트 영역 ============= */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>☀️ {columnLabels[column]} 태양광 분석 차트</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: '11px', color: solarStatus.color, fontWeight: '600' }}>
                                {solarStatus.icon} {solarStatus.text} • {data.length}개 데이터
                            </span>
                            {currentPeakLimit && (
                                <span style={{ fontSize: '11px', color: '#f6465d', fontWeight: '600' }}>
                                    • 🚨 임계값: {currentPeakLimit} {unitLabels[column]}
                                </span>
                            )}
                            <span style={{ fontSize: '11px', color: '#f7931e', fontWeight: '600' }}>
                                • 📊 범위: {zoomLabel}
                            </span>
                            {zoomLevel >= 2 && (
                                <span style={{ fontSize: '11px', color: '#26a69a', fontWeight: '600' }}>
                                    • 🖱️ 클릭으로 드릴다운 가능
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ height: 'calc(100% - 60px)' }}>
                        <LineChartWrapper
                            data={data}
                            keys={[column]}
                            labels={columnLabels}
                            xKey="bucket"
                            zoomLevel={zoomLevel}
                            peakLimit={currentPeakLimit}
                            peakLimitLabel={`${columnLabels[column]} 임계값: ${currentPeakLimit || 0}`}
                            onDataPointClick={onDataPointClick}
                            csvExport={{
                                apiPath: '/data/solar/query',
                                extraParams: { device_id: deviceId },
                                filePrefix: `태양광데이터-센서${deviceId}-${zoomLabel}`,
                            }}
                        />
                    </div>
                </div>

                {/* ============= 태양광센서 통계 카드 그리드 ============= */}
                <div className={styles.statsGrid}>
                    {/* 현재값 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>현재값</div>
                        <div className={styles.statValue}>{currentValue.toFixed(0)}</div>
                        <div className={`${styles.statChange} ${valueChange < 0 ? styles.statChangeNegative : ''}`}>
                            {valueChange >= 0 ? '+' : ''}
                            {valueChange.toFixed(0)} {unitLabels[column]}
                        </div>
                    </div>

                    {/* 평균값 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균 ({zoomLabel})</div>
                        <div className={styles.statValue}>{stats?.[column]?.avg?.toFixed(0) || '0'}</div>
                        <div className={styles.statChange}>평균 {unitLabels[column]}</div>
                    </div>

                    {/* 최대값 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최고값 ({zoomLabel})</div>
                        <div className={styles.statValue}>{stats?.[column]?.max?.toFixed(0) || '0'}</div>
                        <div className={styles.statChange}>최고값</div>
                    </div>

                    {/* 최소값 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최저값 ({zoomLabel})</div>
                        <div className={styles.statValue}>{stats?.[column]?.min?.toFixed(0) || '0'}</div>
                        <div className={styles.statChange}>최저값</div>
                    </div>

                    {/* 데이터 개수 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>측정 횟수</div>
                        <div className={styles.statValue}>{stats?.[column]?.count || '0'}</div>
                        <div className={styles.statChange}>회</div>
                    </div>

                    {/* 태양광 임계값 상태 */}
                    {currentPeakLimit && (
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>임계값 상태</div>
                            <div
                                className={styles.statValue}
                                style={{
                                    color: currentValue > currentPeakLimit ? '#f7931e' : '#0ecb81',
                                }}
                            >
                                {currentValue > currentPeakLimit ? '☀️' : '🌤️'}
                            </div>
                            <div className={styles.statChange}>
                                {currentValue > currentPeakLimit ? '강한 일사량' : '보통 일사량'}
                            </div>
                        </div>
                    )}
                </div>

                {/* ============= 태양광센서 활동 로그 패널 ============= */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>☀️ 태양광센서 활동 로그</div>
                    {logs.slice(-20).map((logEntry, index) => (
                        <div key={index} className={styles.logItem}>
                            {logEntry}
                        </div>
                    ))}
                    {logs.length === 0 && <div className={styles.logItem}>최근 활동 없음</div>}
                </div>
            </div>
        </div>
    );
}
