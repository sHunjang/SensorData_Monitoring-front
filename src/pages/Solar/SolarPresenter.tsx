// src/pages/Solar/SolarPresenter.tsx
import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Solar.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    zoomLevel: number;
    zoomLabel: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onDataPointClick: (d: any, t: number) => void;
    onManualRefresh: () => void;
    data: any[];
    stats: Stat;
    loading: boolean;
    error: string | null;
    logs: string[];
};

export default function SolarPresenter(props: Props) {
    const {
        deviceId,
        deviceOptions,
        zoomLabel,
        onZoomIn,
        onZoomOut,
        canZoomIn,
        canZoomOut,
        onManualRefresh,
        data,
        stats,
        loading,
        error,
        logs,
        onDataPointClick,
    } = props;

    const currentValue = data.length > 0 ? data[data.length - 1]?.irradiance : null;
    const fmt = (v: number | null) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '-');

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>SOLAR SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>Irradiance (W/m²) / {zoomLabel}</p>
                    </div>
                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>{fmt(currentValue)} W/m²</p>
                        <p className={styles.priceChange}>
                            <span>▲</span> Live
                        </p>
                    </div>
                </div>

                {/* 요약 카드 */}
                <div className={styles.envGrid}>
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>☀️</span>
                            Current Irradiance
                        </div>
                        <div className={styles.envValue}>{fmt(currentValue)}</div>
                        <span className={styles.envUnit}>W/m²</span>
                        <div className={styles.envStatus}>NORMAL</div>
                    </div>
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>📊</span>
                            Avg Irradiance
                        </div>
                        <div className={styles.envValue}>{fmt(stats?.avg)}</div>
                        <span className={styles.envUnit}>W/m²</span>
                        <div className={styles.envStatus}>{stats?.count ?? 0} Samples</div>
                    </div>
                </div>

                {/* 컨트롤 */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        <div className={styles.controlGroup}>
                            <label>Device ID</label>
                            <select value={deviceId} onChange={(e) => props.setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        {id}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.controlGroup}>
                            <label>Zoom</label>
                            <button onClick={onZoomIn} disabled={!canZoomIn}>
                                ➖ In
                            </button>
                        </div>
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <button onClick={onZoomOut} disabled={!canZoomOut}>
                                ➕ Out
                            </button>
                        </div>
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <button onClick={onManualRefresh} disabled={loading}>
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            padding: '12px',
                            background: '#f87171',
                            color: '#fff',
                            borderRadius: '8px',
                            marginBottom: '8px',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* 차트 */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>Irradiance (W/m²)</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Points: {data.length}</span>
                        </div>
                    </div>
                    <LineChartWrapper
                        data={data}
                        keys={['irradiance']}
                        labels={{ irradiance: 'Irradiance (W/m²)' }}
                        xKey="bucket"
                        onDataPointClick={onDataPointClick}
                        zoomLevel={props.zoomLevel}
                    />
                </div>

                {/* 통계 */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균</div>
                        <div className={styles.statValue}>{fmt(stats?.avg)}</div>
                        <div className={styles.statChange}>▲ Live</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최대</div>
                        <div className={styles.statValue}>{fmt(stats?.max)}</div>
                        <div className={styles.statChange}>▲ Peak</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최소</div>
                        <div className={styles.statValue}>{fmt(stats?.min)}</div>
                        <div className={styles.statChange}>▼ Low</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>샘플 수</div>
                        <div className={styles.statValue}>{stats?.count ?? 0}</div>
                        <div className={styles.statChange}>Total</div>
                    </div>
                </div>

                {/* 로그 */}
                {logs.length > 0 && (
                    <div className={styles.logPanel}>
                        <div className={styles.logHeader}>📜 Activity Log</div>
                        {logs.slice(-10).map((log, i) => (
                            <div key={i} className={styles.logItem}>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
