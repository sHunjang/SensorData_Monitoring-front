/**
 * SolarPresenter.tsx
 * - 목적: 태양광 일사량 대시보드의 UI 렌더링
 * - 기능:
 *   - 헤더(장치, 현재값, 상태)
 *   - 컨트롤(장치 선택, 줌 인/아웃, 수동 새로고침)
 *   - 라인차트(공통 LineChartWrapper 사용, preset 전달)
 *   - 통계 카드(평균/최대/최소/샘플 수)
 *   - 로그 패널
 *
 * 사용법:
 * - Container에서 data/stats/loading/error/logs 등을 전달하면 Presenter가 그려줌.
 * - preset이 주어지면 LineChartWrapper에 전달해 X축 포맷을 제어.
 */
import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Solar.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    zoomLevel: number; // 0..3
    zoomLabel: string;
    preset?: '1h' | '1d' | '1w' | '1mo'; // optional: 우선 사용
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onDataPointClick?: (d: any, t: number) => void;
    onManualRefresh: () => void;
    data: any[]; // [{bucket: string, irradiance: number}, ...]
    stats: Stat;
    loading: boolean;
    error: string | null;
    logs: string[];
    peakLimits?: Record<string, number>;
    setPeakLimits?: (p: Record<string, number>) => void;
};

export default function SolarPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    zoomLevel,
    zoomLabel,
    preset,
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
    peakLimits = {},
}: Props) {
    // 간단 로딩/에러 처리
    if (loading)
        return (
            <div className={styles.container}>
                <div className={styles.content}>로딩 중...</div>
            </div>
        );
    if (error)
        return (
            <div className={styles.container}>
                <div className={styles.content} style={{ padding: 16, color: '#f87171' }}>
                    {error}
                </div>
            </div>
        );

    // 현재 값 계산 (마지막 포인트)
    const last = data?.length ? data[data.length - 1] : null;
    const currentValue = last?.irradiance ?? null;
    const fmt = (v: number | null, digits = 2) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

    const currentPeakLimit = peakLimits?.solar ?? null;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>SOLAR SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>Irradiance (W/m²) · {zoomLabel}</p>
                    </div>

                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>
                            {fmt(currentValue)} <span style={{ fontSize: 12 }}>W/m²</span>
                        </p>
                        <p className={styles.priceChange}>{currentValue !== null ? 'Live' : 'No data'}</p>
                    </div>
                </div>

                {/* 요약 카드
                <div className={styles.envGrid}>
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>☀️</span> Current Irradiance
                        </div>
                        <div className={styles.envValue}>{fmt(currentValue)}</div>
                        <div className={styles.envUnit}>W/m²</div>
                        <div className={styles.envStatus}>
                            {currentValue !== null && currentPeakLimit !== null && currentValue > currentPeakLimit
                                ? 'ALERT'
                                : 'NORMAL'}
                        </div>
                    </div>

                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>📊</span> Avg Irradiance
                        </div>
                        <div className={styles.envValue}>{fmt(stats?.avg)}</div>
                        <div className={styles.envUnit}>W/m²</div>
                        <div className={styles.envStatus}>{stats?.count ?? 0} Samples</div>
                    </div>
                </div> */}

                {/* 컨트롤 */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        <div className={styles.controlGroup}>
                            <label>Device ID</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>Zoom</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={onZoomIn} disabled={!canZoomIn}>
                                    ➕ In
                                </button>
                                <button onClick={onZoomOut} disabled={!canZoomOut}>
                                    ➖ Out
                                </button>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <button onClick={onManualRefresh}>🔄 Refresh</button>
                        </div>
                    </div>
                </div>

                {/* 에러 배너 (선택적) */}
                {error && (
                    <div style={{ padding: 12, background: '#f87171', color: '#fff', borderRadius: 8 }}>{error}</div>
                )}

                {/* 차트 섹션 */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>Irradiance (W/m²)</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                            {currentPeakLimit && (
                                <span style={{ marginLeft: 8, color: '#f6465d' }}>Limit: {currentPeakLimit}</span>
                            )}
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={['irradiance']}
                        labels={{ irradiance: 'Irradiance (W/m²)' }}
                        xKey="bucket"
                        // preset이 있으면 우선 사용. 없으면 zoomLevel로 포맷터 결정 (LineChartWrapper 내부에서 처리)
                        zoomLevel={zoomLevel}
                        preset={preset}
                        peakLimit={currentPeakLimit ?? undefined}
                        peakLimitLabel={currentPeakLimit ? `임계값: ${currentPeakLimit} W/m²` : undefined}
                        onDataPointClick={onDataPointClick}
                        csvExport={{
                            apiPath: '/data/solar/query',
                            extraParams: { deviceid: deviceId },
                            filePrefix: `solar-${deviceId}-${zoomLabel}`,
                        }}
                        height={420}
                    />
                </div>

                {/* 통계 카드 */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균</div>
                        <div className={styles.statValue}>{fmt(stats?.avg)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최대</div>
                        <div className={styles.statValue}>{fmt(stats?.max)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최소</div>
                        <div className={styles.statValue}>{fmt(stats?.min)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>샘플 수</div>
                        <div className={styles.statValue}>{stats?.count ?? 0}</div>
                    </div>
                </div>

                {/* 로그 패널 */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>📜 Activity Log</div>
                    {logs.length ? (
                        logs.slice(-20).map((l, i) => (
                            <div key={i} className={styles.logItem}>
                                {l}
                            </div>
                        ))
                    ) : (
                        <div className={styles.logItem}>최근 활동 없음</div>
                    )}
                </div>
            </div>
        </div>
    );
}
