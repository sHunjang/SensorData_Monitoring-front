// src/pages/Modbus/ModbusPresenter.tsx
import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Modbus.module.css'; // ✅ 정확한 경로

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: string;
    setColumn: (c: string) => void;
    zoomLevel: number;
    zoomLabel: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onDataPointClick: (d: any, t: number) => void;
    onManualRefresh: () => void;
    data: any[];
    stats: Record<string, Stat>;
    loading: boolean;
    error: string | null;
    logs: string[];
    peakLimits: Record<string, number>;
    setPeakLimits: (p: Record<string, number>) => void;
};

const KEYS = [
    'activepower',
    'reactivepower',
    'apparentpower',
    'voltagell',
    'voltageln',
    'current',
    'powerfactor',
    'activeenergy',
    'reactiveenergy',
    'apparentenergy',
];
const LABELS: Record<string, string> = {
    activepower: 'Active Power (kW)',
    reactivepower: 'Reactive Power (kVar)',
    apparentpower: 'Apparent Power (kVA)',
    voltagell: 'Voltage L-L (V)',
    voltageln: 'Voltage L-N (V)',
    current: 'Sum Line Currents (A)',
    powerfactor: 'Power Factor',
    activeenergy: 'Active Energy (kWh)',
    reactiveenergy: 'Reactive Energy (kVArh)',
    apparentenergy: 'Apparent Energy (kVAh)',
};

export default function ModbusPresenter(props: Props) {
    const {
        deviceId,
        deviceOptions,
        column,
        setColumn,
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

    const currentStat = stats[column];
    const currentValue = data.length > 0 ? data[data.length - 1]?.[column] : null;
    const fmt = (v: number | null) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '-');

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>MODBUS SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>
                            {LABELS[column]} / {zoomLabel}
                        </p>
                    </div>
                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>{fmt(currentValue)}</p>
                        <p className={styles.priceChange}>
                            <span>▲</span> Live
                        </p>
                    </div>
                </div>

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
                            <label>Metric</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value)}>
                                {KEYS.map((k) => (
                                    <option key={k} value={k}>
                                        {LABELS[k]}
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

                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>{LABELS[column]}</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Points: {data.length}</span>
                        </div>
                    </div>
                    <LineChartWrapper
                        data={data}
                        keys={[column]}
                        labels={{ [column]: LABELS[column] }}
                        xKey="bucket"
                        onDataPointClick={onDataPointClick}
                        zoomLevel={props.zoomLevel}
                    />
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균</div>
                        <div className={styles.statValue}>{fmt(currentStat?.avg)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최대</div>
                        <div className={styles.statValue}>{fmt(currentStat?.max)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최소</div>
                        <div className={styles.statValue}>{fmt(currentStat?.min)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>샘플 수</div>
                        <div className={styles.statValue}>{currentStat?.count ?? 0}</div>
                    </div>
                </div>

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
