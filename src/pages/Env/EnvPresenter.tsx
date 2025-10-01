// src/pages/env/EnvPresenter.tsx
import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import styles from './Env.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Column = 'temperature' | 'humidity';

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

    onDataPointClick: (d: any, t: number) => void;
    onManualRefresh: () => void;

    data: Array<{ bucket: number; temperature?: number | null; humidity?: number | null }>;
    stats: Record<Column, Stat>;
    loading: boolean;
    error: string | null;
    logs: string[];

    peakLimits: Record<string, number>;
    setPeakLimits: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const LABELS: Record<Column, string> = { temperature: 'Temperature', humidity: 'Humidity' };
const UNITS: Record<Column, string> = { temperature: '°C', humidity: '%' };

export default function EnvPresenter(props: Props) {
    const {
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
    } = props;

    // 현재/이전 값, 증감/증감률
    const last = data.length ? data[data.length - 1] : null;
    const prev = data.length > 1 ? data[data.length - 2] : null;
    const currentValue = (last?.[column] ?? null) as number | null;
    const previousValue = (prev?.[column] ?? null) as number | null;

    const delta = currentValue != null && previousValue != null ? currentValue - previousValue : 0;
    const changePct =
        currentValue != null && previousValue && Number.isFinite(previousValue)
            ? ((delta / previousValue) * 100).toFixed(2)
            : '0.00';

    const fmt = (v: number | null, digits = 1) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

    // 임계값 편집/삭제
    const currentPeakLimit = peakLimits[column];
    const handlePeakLimitChange = (raw: string) => {
        const n = parseFloat(raw);
        if (!isNaN(n) && Number.isFinite(n)) {
            setPeakLimits((old) => ({ ...old, [column]: n }));
        }
    };
    const handlePeakLimitRemove = () => {
        setPeakLimits((old) => {
            const next = { ...old };
            delete next[column];
            return next;
        });
    };

    // 상태 뱃지(예시)
    const statusBadge = (() => {
        const v = currentValue ?? 0;
        if (column === 'temperature') {
            if (v >= 35) return { text: '고온경보', color: '#f6465d', icon: '🔥' };
            if (v >= 30) return { text: '고온주의', color: '#f7931e', icon: '🌡️' };
            if (v >= 20) return { text: '적정온도', color: '#0ecb81', icon: '✅' };
            if (v >= 10) return { text: '저온주의', color: '#f7931e', icon: '❄️' };
            return { text: '저온경보', color: '#f6465d', icon: '🧊' };
        } else {
            if (v >= 80) return { text: '고습경보', color: '#f6465d', icon: '💧' };
            if (v >= 70) return { text: '고습주의', color: '#f7931e', icon: '🌫️' };
            if (v >= 40) return { text: '적정습도', color: '#0ecb81', icon: '✅' };
            if (v >= 30) return { text: '건조주의', color: '#f7931e', icon: '🏜️' };
            return { text: '건조경보', color: '#f6465d', icon: '🔥' };
        }
    })();

    const currentStat = stats[column];

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>ENV SENSOR {deviceId}</h1>
                        <p className={styles.subtitle}>
                            {LABELS[column]} / {zoomLabel}
                        </p>
                    </div>
                    <div className={styles.priceInfo}>
                        <p className={styles.currentPrice}>
                            {fmt(currentValue)} {UNITS[column]}
                        </p>
                        <p className={`${styles.priceChange} ${delta < 0 ? styles.priceChangeNegative : ''}`}>
                            <span>{delta >= 0 ? '📈' : '📉'}</span>
                            <span>{changePct}%</span>
                            <span>
                                ({delta >= 0 ? '+' : ''}
                                {fmt(delta)})
                            </span>
                        </p>
                    </div>
                </div>

                {/* 컨트롤 */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        <div className={styles.controlGroup}>
                            <label>환경센서</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        센서 {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>측정 항목</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value as Column)}>
                                <option value="temperature">🌡️ 온도 (°C)</option>
                                <option value="humidity">💧 습도 (%)</option>
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>🔍 시간 범위</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    onClick={onZoomIn}
                                    disabled={!canZoomIn}
                                    title={canZoomIn ? '더 확대' : '최대 확대됨'}
                                >
                                    🔍+ 확대
                                </button>
                                <button
                                    onClick={onZoomOut}
                                    disabled={!canZoomOut}
                                    title={canZoomOut ? '더 축소' : '최대 축소됨'}
                                >
                                    🔍- 축소
                                </button>
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>📊 현재 보기</label>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: '#2b2f36',
                                    border: `2px solid ${zoomLevel <= 1 ? '#26a69a' : '#f7931e'}`,
                                    borderRadius: 4,
                                    color: zoomLevel <= 1 ? '#26a69a' : '#f7931e',
                                    fontSize: 12,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                {zoomLevel <= 1 && <span>🔴</span>}
                                📅 {zoomLabel}
                                {zoomLevel <= 1 && <span>(실시간)</span>}
                            </div>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>🚨 환경 임계값 ({UNITS[column]})</label>
                            <input
                                type="number"
                                step={column === 'temperature' ? '0.1' : '1'}
                                value={currentPeakLimit ?? ''}
                                onChange={(e) => handlePeakLimitChange(e.target.value)}
                                placeholder={column === 'temperature' ? '온도 임계값' : '습도 임계값'}
                                style={{
                                    background: '#2b2f36',
                                    border: '1px solid #2e3238',
                                    color: '#f7f8fa',
                                    padding: '8px 12px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                }}
                            />
                        </div>

                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={onManualRefresh} disabled={loading} style={{ flex: 1, fontSize: 11 }}>
                                    🔄 새로고침
                                </button>
                                {currentPeakLimit != null && (
                                    <button
                                        onClick={handlePeakLimitRemove}
                                        style={{ flex: 1, background: '#f6465d', borderColor: '#f6465d', fontSize: 11 }}
                                    >
                                        🗑️ 제거
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 에러 배너 */}
                {error && (
                    <div
                        style={{
                            padding: 12,
                            background: '#f87171',
                            color: '#fff',
                            borderRadius: 8,
                            marginBottom: 8,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* 차트 */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>
                            {LABELS[column]} ({UNITS[column]})
                        </div>
                        <div className={styles.chartControls}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Points: {data.length}</span>
                            {zoomLevel >= 2 && (
                                <span style={{ fontSize: 11, color: '#26a69a', fontWeight: 600, marginLeft: 8 }}>
                                    • 🖱️ 클릭으로 드릴다운 가능
                                </span>
                            )}
                            {currentPeakLimit != null && (
                                <span style={{ fontSize: 11, color: '#f6465d', fontWeight: 600, marginLeft: 8 }}>
                                    • 🚨 임계값: {currentPeakLimit} {UNITS[column]}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: '#f7931e', fontWeight: 600, marginLeft: 8 }}>
                                • 범위: {zoomLabel}
                            </span>
                        </div>
                    </div>

                    <LineChartWrapper
                        data={data}
                        keys={[column]}
                        labels={{ [column]: `${LABELS[column]} (${UNITS[column]})` }}
                        xKey="bucket"
                        onDataPointClick={onDataPointClick}
                        zoomLevel={zoomLevel}
                    />
                </div>

                {/* 통계 */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>현재값</div>
                        <div className={styles.statValue}>{fmt(currentValue)}</div>
                        <div className={`${styles.statChange} ${delta < 0 ? styles.statChangeNegative : ''}`}>
                            {delta >= 0 ? '+' : ''}
                            {fmt(delta)} {UNITS[column]}
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균 ({zoomLabel})</div>
                        <div className={styles.statValue}>{fmt(currentStat?.avg)}</div>
                        <div className={styles.statChange}>평균 {UNITS[column]}</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최고값 ({zoomLabel})</div>
                        <div className={styles.statValue}>{fmt(currentStat?.max)}</div>
                        <div className={styles.statChange}>최고값</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>최저값 ({zoomLabel})</div>
                        <div className={styles.statValue}>{fmt(currentStat?.min)}</div>
                        <div className={styles.statChange}>최저값</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>측정 횟수</div>
                        <div className={styles.statValue}>{currentStat?.count ?? 0}</div>
                        <div className={styles.statChange}>회</div>
                    </div>

                    {currentPeakLimit != null && (
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>임계값 상태</div>
                            <div
                                className={styles.statValue}
                                style={{
                                    color:
                                        currentValue != null && currentValue > currentPeakLimit ? '#f6465d' : '#0ecb81',
                                }}
                            >
                                {currentValue != null && currentValue > currentPeakLimit ? '⚠️' : '✅'}
                            </div>
                            <div className={styles.statChange}>
                                {currentValue != null && currentValue > currentPeakLimit ? '임계값 초과' : '정상 범위'}
                            </div>
                        </div>
                    )}
                </div>

                {/* 로그 */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>🌡️ 환경센서 활동 로그</div>
                    {logs.length ? (
                        logs.slice(-20).map((log, i) => (
                            <div key={i} className={styles.logItem}>
                                {log}
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
