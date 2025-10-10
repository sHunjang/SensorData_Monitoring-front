import React from 'react';
import { LineChartWrapper } from '@/components/charts/LineChartWrapper';
import ZoomPanControls from '@/components/ui/ZoomPanControls';
import styles from './Solar.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Preset = '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];

    zoomLevel: number;
    zoomLabel: string;
    preset?: Preset;

    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;

    onDataPointClick?: (d: any, t: number) => void;
    onManualRefresh: () => void;

    data: any[];
    stats: Stat;
    loading: boolean;
    error: string | null;
    logs: string[];

    peakLimits?: Record<string, number>;
    setPeakLimits?: (p: Record<string, number>) => void;

    startAt?: string | null;
    endAt?: string | null;
    setStartAt?: (v: string | null) => void;
    setEndAt?: (v: string | null) => void;
    setRelativeRange?: (minutes: number) => void;
    isRangeMode?: boolean;

    panLeft?: () => void;
    panRight?: () => void;
};

const LABEL = 'Irradiance';
const UNIT = 'W/m²';

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
    setPeakLimits,
    startAt,
    endAt,
    setStartAt,
    setEndAt,
    setRelativeRange,
    isRangeMode,
    panLeft,
    panRight,
}: Props) {
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

    const last = data?.length ? data[data.length - 1] : null;
    const prev = data?.length > 1 ? data[data.length - 2] : null;
    const currentValue = (last?.irradiance ?? null) as number | null;
    const previousValue = (prev?.irradiance ?? null) as number | null;
    const delta = currentValue != null && previousValue != null ? currentValue - previousValue : 0;
    const changePct =
        previousValue && Number.isFinite(previousValue)
            ? `${((delta / previousValue) * 100 || 0).toFixed(2)}%`
            : '0.00%';
    const fmt = (v: number | null, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '-');

    const currentPeakLimit = peakLimits?.solar ?? null;
    const handlePeakLimitChange = (raw: string) => {
        const n = parseFloat(raw);
        if (!isNaN(n) && Number.isFinite(n) && setPeakLimits) {
            setPeakLimits({ ...peakLimits, solar: n });
        }
    };
    const handlePeakLimitRemove = () => {
        if (setPeakLimits) {
            const copy = { ...peakLimits };
            delete copy.solar;
            setPeakLimits(copy);
        }
    };

    const clearRange = () => {
        setStartAt?.(null);
        setEndAt?.(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>SOLAR SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>
                            {LABEL} · {zoomLabel}
                        </p>
                    </div>
                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>
                            {fmt(currentValue)} <span style={{ fontSize: 12 }}>{UNIT}</span>
                        </p>
                        <p className={styles.priceChange} style={{ color: delta >= 0 ? '#0ecb81' : '#f6465d' }}>
                            <span>{delta >= 0 ? '▲' : '▼'}</span> {changePct} ({delta >= 0 ? '+' : ''}
                            {fmt(delta)})
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div style={{ maxWidth: '100%' }}>
                        <ZoomPanControls
                            zoom={zoomLevel}
                            zoomLabel={zoomLabel}
                            onZoomIn={onZoomIn}
                            onZoomOut={onZoomOut}
                            canZoomIn={canZoomIn}
                            canZoomOut={canZoomOut}
                            onPanLeft={panLeft}
                            onPanRight={panRight}
                            startAt={startAt}
                            endAt={endAt}
                            setStartAt={setStartAt}
                            setEndAt={setEndAt}
                            setRelativeRange={setRelativeRange}
                            onRefresh={onManualRefresh}
                        />
                    </div>

                    <div
                        style={{
                            marginTop: 12,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 12,
                        }}
                    >
                        <div className={styles.controlGroup}>
                            <label>Device ID</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        센서 {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>임계값 ({UNIT})</label>
                            <input
                                type="number"
                                step="1"
                                value={currentPeakLimit ?? ''}
                                onChange={(e) => handlePeakLimitChange(e.target.value)}
                                placeholder="예: 1000"
                                style={{
                                    background: '#2b2f36',
                                    border: '1px solid #2e3238',
                                    color: '#f7f8fa',
                                    padding: '8px',
                                }}
                            />
                        </div>

                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={onManualRefresh} className="primary">
                                    🔄 Refresh
                                </button>
                                {currentPeakLimit != null && (
                                    <button
                                        onClick={handlePeakLimitRemove}
                                        style={{ background: '#f6465d', color: '#fff' }}
                                    >
                                        🗑️ Remove
                                    </button>
                                )}
                                <button onClick={clearRange}>Clear Range</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    {isRangeMode ? (
                        <div style={{ color: '#f59e0b' }}>
                            범위 모드: 수동 기간({startAt} ~ {endAt}) — 실시간 폴링 비활성
                        </div>
                    ) : (
                        <div style={{ color: '#94a3b8' }}>실시간/프리셋 모드</div>
                    )}
                </div>

                {error && (
                    <div style={{ padding: 12, background: '#f87171', color: '#fff', borderRadius: 8 }}>{error}</div>
                )}

                {/* Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>
                            {LABEL} ({UNIT})
                        </div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                            {currentPeakLimit != null && (
                                <span style={{ marginLeft: 8, color: '#f6465d' }}>Limit: {currentPeakLimit}</span>
                            )}
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={['irradiance']}
                        labels={{ irradiance: `${LABEL} (${UNIT})` }}
                        xKey="bucket"
                        preset={preset}
                        peakLimit={currentPeakLimit ?? undefined}
                        peakLimitLabel={currentPeakLimit ? `${LABEL} 임계값: ${currentPeakLimit}${UNIT}` : undefined}
                        onDataPointClick={onDataPointClick}
                        csvExport={{
                            filename: `solar-${deviceId}-${zoomLabel}.csv`,
                            headers: ['bucket', 'irradiance'],
                        }}
                        height={420}
                    />
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균</div>
                        <div className={styles.statValue}>{fmt(stats.avg)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최대</div>
                        <div className={styles.statValue}>{fmt(stats.max)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최소</div>
                        <div className={styles.statValue}>{fmt(stats.min)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>샘플 수</div>
                        <div className={styles.statValue}>{stats.count ?? 0}</div>
                    </div>
                </div>

                {/* Logs */}
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
