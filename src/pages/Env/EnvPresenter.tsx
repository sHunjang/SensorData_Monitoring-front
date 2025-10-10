import React from 'react';
import { LineChartWrapper } from '@/components/charts/LineChartWrapper';
import ZoomPanControls from '@/components/ui/ZoomPanControls';
import styles from './Env.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];

    // ✅ Zoom 관련
    zoomLevel: number;
    zoomLabel: string;
    preset?: '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onDataPointClick?: (d: any, t: number) => void;
    onManualRefresh: () => void;

    // ✅ 데이터
    data: any[];
    statsTemp: Stat;
    statsHumidity: Stat;
    loading: boolean;
    error: string | null;
    logs: string[];

    // ✅ Peak Limits
    peakLimits?: Record<string, number>;
    setPeakLimits?: (p: Record<string, number>) => void;

    // ✅ 시간 범위
    startAt?: string | null;
    endAt?: string | null;
    setStartAt?: (v: string | null) => void;
    setEndAt?: (v: string | null) => void;
    setRelativeRange?: (minutes: number) => void;
    isRangeMode?: boolean;

    // ✅ Pan 컨트롤
    panLeft?: () => void;
    panRight?: () => void;
};

export default function EnvPresenter({
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
    statsTemp,
    statsHumidity,
    loading,
    error,
    logs,
    peakLimits = {},
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
    const currentTemp = last?.temperature ?? null;
    const currentHumidity = last?.humidity ?? null;
    const fmt = (v: number | null, digits = 2) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>ENV SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>Temperature & Humidity · {zoomLabel}</p>
                    </div>

                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>
                            {fmt(currentTemp)}°C / {fmt(currentHumidity)}%
                        </p>
                        <p className={styles.priceChange}>{currentTemp !== null ? 'Live' : 'No data'}</p>
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
                                        {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <button onClick={onManualRefresh} className="primary">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    {isRangeMode ? (
                        <div style={{ color: '#f59e0b' }}>
                            범위 모드: {startAt} ~ {endAt} — 폴링 중지
                        </div>
                    ) : (
                        <div style={{ color: '#94a3b8' }}>실시간/프리셋 모드</div>
                    )}
                </div>

                {/* Temperature Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>Temperature (°C)</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={['temperature']}
                        labels={{ temperature: 'Temperature (°C)' }}
                        xKey="bucket"
                        preset={preset}
                        onDataPointClick={onDataPointClick}
                        height={320}
                    />
                </div>

                {/* Humidity Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>Humidity (%)</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={['humidity']}
                        labels={{ humidity: 'Humidity (%)' }}
                        xKey="bucket"
                        preset={preset}
                        onDataPointClick={onDataPointClick}
                        height={320}
                    />
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>온도 평균</div>
                        <div className={styles.statValue}>{fmt(statsTemp?.avg)}°C</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>온도 최대</div>
                        <div className={styles.statValue}>{fmt(statsTemp?.max)}°C</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>습도 평균</div>
                        <div className={styles.statValue}>{fmt(statsHumidity?.avg)}%</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>습도 최대</div>
                        <div className={styles.statValue}>{fmt(statsHumidity?.max)}%</div>
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
