/**
 * ModbusPresenter.tsx
 * - 목적: Modbus 페이지 UI (ModbusContainer가 상태/데이터 제공)
 * - 변경점: 측정 항목 select에 optgroup 적용. select value는 snake_case 키(ex: active_power).
 * - 차트/통계/헤더는 선택된 column에 따라 동작.
 */

import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Modbus.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

// permitted column keys (snake_case used in select)
type Column =
    | 'active_power'
    | 'reactive_power'
    | 'apparent_power'
    | 'voltage_ll'
    | 'voltage_ln'
    | 'current'
    | 'power_factor'
    | 'active_energy'
    | 'reactive_energy'
    | 'apparent_energy';

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: Column;
    setColumn: (c: Column) => void;
    zoomLevel: number;
    zoomLabel: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onDataPointClick?: (d: any, t: number) => void;
    onManualRefresh: () => void;
    data: any[]; // each row has bucket and keys named like Column above
    stats: Record<Column, Stat>;
    loading: boolean;
    error: string | null;
    logs: string[];
    peakLimits: Record<string, number>;
    setPeakLimits: (p: Record<string, number>) => void;
};

const LABELS: Record<Column, string> = {
    active_power: '유효전력 (kW)',
    reactive_power: '무효전력 (kVAR)',
    apparent_power: '피상전력 (kVA)',
    voltage_ll: '선간전압 (V)',
    voltage_ln: '상전압 (V)',
    current: '전류 (A)',
    power_factor: '역률',
    active_energy: '유효전력량 (kWh)',
    reactive_energy: '무효전력량 (kVArh)',
    apparent_energy: '피상전력량 (kVAh)',
};

export default function ModbusPresenter({
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
    const currentStat = stats[column];
    const currentValue = data.length ? data[data.length - 1]?.[column] ?? null : null;
    const fmt = (v: number | null) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '-');

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>MODBUS SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>
                            {LABELS[column]} · {zoomLabel}
                        </p>
                    </div>

                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>{fmt(currentValue)}</p>
                        <p className={styles.priceChange}>
                            <span>▲</span> Live
                        </p>
                    </div>
                </div>

                {/* Controls */}
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

                        {/* 데이터 타입 선택: optgroup 구조 그대로 사용 */}
                        <div className={styles.controlGroup}>
                            <label>측정 항목</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value as Column)}>
                                <optgroup label="🔌 전력">
                                    <option value="active_power">유효전력 (kW)</option>
                                    <option value="reactive_power">무효전력 (kVAR)</option>
                                    <option value="apparent_power">피상전력 (kVA)</option>
                                </optgroup>
                                <optgroup label="⚡ 전압">
                                    <option value="voltage_ll">선간전압 (V)</option>
                                    <option value="voltage_ln">상전압 (V)</option>
                                </optgroup>
                                <optgroup label="🔋 전류 & 역률">
                                    <option value="current">전류 (A)</option>
                                    <option value="power_factor">역률</option>
                                </optgroup>
                                <optgroup label="📈 전력량">
                                    <option value="active_energy">유효전력량 (kWh)</option>
                                    <option value="reactive_energy">무효전력량 (kVArh)</option>
                                    <option value="apparent_energy">피상전력량 (kVAh)</option>
                                </optgroup>
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
                            <button onClick={onManualRefresh} disabled={loading}>
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* 에러 배너 */}
                {error && (
                    <div
                        style={{ padding: 12, background: '#f87171', color: '#fff', borderRadius: 8, marginBottom: 8 }}
                    >
                        {error}
                    </div>
                )}

                {/* Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>{LABELS[column]}</div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={[column]}
                        labels={{ [column]: LABELS[column] }}
                        xKey="bucket"
                        onDataPointClick={onDataPointClick}
                        zoomLevel={zoomLevel}
                        // preset is controlled by container; Presenter doesn't need to pass it here.
                    />
                </div>

                {/* Stats */}
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

                {/* Logs */}
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
