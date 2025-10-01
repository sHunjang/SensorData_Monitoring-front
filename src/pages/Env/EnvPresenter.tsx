/**
 * EnvPresenter.tsx
 * - Modbus 페이지 UI 패턴에 맞춘 Env(온도/습도) Presenter
 * - 역할: UI 렌더링 전담. 상태/로직은 Container에서 제공.
 *
 * 주요 특징:
 * - 헤더: 장치, 현재값, 서브타이틀(항목 + 줌 라벨)
 * - 컨트롤: 장치 선택, 항목 선택(온도/습도), 줌 인/아웃, 수동 새로고침
 * - 차트: LineChartWrapper 사용, preset 전달로 X축 포맷 제어
 * - 통계: 평균/최대/최소/샘플 수
 * - 로그 패널
 *
 * 주의: Presenter는 데이터 포맷({ bucket: ISOstring, temperature, humidity })을 기대.
 */

import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Env.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
type Column = 'temperature' | 'humidity';
type Preset = '10s' | '1m' | '15m' | '1h' | '1d' | '1w' | '1mo';

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: Column;
    setColumn: (c: Column) => void;

    zoomLevel: number; // 0..6
    zoomLabel: string;
    preset?: Preset; // Container가 제공하면 우선 사용

    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;

    onDataPointClick?: (d: any, t: number) => void;
    onManualRefresh: () => void;

    data: Array<{ bucket: string | number; temperature?: number | null; humidity?: number | null }>;
    stats: Record<Column, Stat>;
    loading: boolean;
    error: string | null;
    logs: string[];

    peakLimits: Record<string, number>;
    setPeakLimits: (p: Record<string, number>) => void;
};

const LABELS: Record<Column, string> = { temperature: '온도', humidity: '습도' };
const UNITS: Record<Column, string> = { temperature: '°C', humidity: '%' };

export default function EnvPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    column,
    setColumn,
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
    peakLimits,
    setPeakLimits,
}: Props) {
    // 로딩/에러 우선 처리
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

    // 최근값 / 이전값, delta 계산
    const last = data?.length ? data[data.length - 1] : null;
    const prev = data?.length > 1 ? data[data.length - 2] : null;
    const currentValue = (last?.[column] ?? null) as number | null;
    const previousValue = (prev?.[column] ?? null) as number | null;

    const delta = currentValue != null && previousValue != null ? currentValue - previousValue : 0;
    const changePct =
        previousValue && Number.isFinite(previousValue)
            ? `${((delta / previousValue) * 100 || 0).toFixed(2)}%`
            : '0.00%';

    const fmt = (v: number | null, d = 1) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '-');

    // 임계값(peak) 편집 핸들러 (간단)
    const currentPeakLimit = peakLimits[column];
    const handlePeakLimitChange = (raw: string) => {
        const n = parseFloat(raw);
        if (!isNaN(n) && Number.isFinite(n)) {
            setPeakLimits({ ...peakLimits, [column]: n });
        }
    };
    const handlePeakLimitRemove = () => {
        const copy = { ...peakLimits };
        delete copy[column];
        setPeakLimits(copy);
    };

    const currentStat = stats[column];

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>ENV SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>
                            {LABELS[column]} · {zoomLabel}
                        </p>
                    </div>
                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>
                            {fmt(currentValue)} <span style={{ fontSize: 12 }}>{UNITS[column]}</span>
                        </p>
                        <p className={styles.priceChange}>
                            <span>{delta >= 0 ? '▲' : '▼'}</span> {changePct} ({delta >= 0 ? '+' : ''}
                            {fmt(delta)})
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
                                        센서 {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>항목</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value as Column)}>
                                <option value="temperature">🌡️ 온도 (°C)</option>
                                <option value="humidity">💧 습도 (%)</option>
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
                            <label>임계값 ({UNITS[column]})</label>
                            <input
                                type="number"
                                step={column === 'temperature' ? '0.1' : '1'}
                                value={currentPeakLimit ?? ''}
                                onChange={(e) => handlePeakLimitChange(e.target.value)}
                                placeholder={`예: ${column === 'temperature' ? '30.0' : '80'}`}
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
                                <button onClick={onManualRefresh}>🔄 Refresh</button>
                                {currentPeakLimit != null && (
                                    <button
                                        onClick={handlePeakLimitRemove}
                                        style={{ background: '#f6465d', color: '#fff' }}
                                    >
                                        🗑️ Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{ padding: 12, background: '#f87171', color: '#fff', borderRadius: 8 }}>{error}</div>
                )}

                {/* Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>
                            {LABELS[column]} ({UNITS[column]})
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
                        keys={[column]}
                        labels={{ [column]: `${LABELS[column]} (${UNITS[column]})` }}
                        xKey="bucket"
                        // preset이 있으면 우선 사용. 없으면 zoomLevel 매핑.
                        zoomLevel={preset ? undefined : zoomLevel}
                        preset={preset}
                        peakLimit={currentPeakLimit}
                        peakLimitLabel={
                            currentPeakLimit
                                ? `${LABELS[column]} 임계값: ${currentPeakLimit}${UNITS[column]}`
                                : undefined
                        }
                        onDataPointClick={onDataPointClick}
                        csvExport={{
                            apiPath: '/data/env/query',
                            extraParams: { deviceid: deviceId },
                            filePrefix: `env-${deviceId}-${column}-${zoomLabel}`,
                        }}
                        height={420}
                    />
                </div>

                {/* Stats grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균</div>
                        <div className={styles.statValue}>{fmt(currentStat.avg)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최대</div>
                        <div className={styles.statValue}>{fmt(currentStat.max)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최소</div>
                        <div className={styles.statValue}>{fmt(currentStat.min)}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>샘플 수</div>
                        <div className={styles.statValue}>{currentStat.count ?? 0}</div>
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
