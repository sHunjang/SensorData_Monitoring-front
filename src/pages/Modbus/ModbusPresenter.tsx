import React from 'react';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import ZoomPanControls from '@/components/ui/ZoomPanControls';
import styles from './Modbus.module.css';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

type Column =
    | 'active_power'
    | 'reactive_power'
    | 'apparent_power'
    | 'voltage_ll'
    | 'voltage_ln'
    | 'current'
    | 'power_factor'
    | 'active_energy'
    | 'total_energy' // ✅ 추가: 총 누적 전력량
    | 'reactive_energy'
    | 'apparent_energy';

type Preset = '1day' | '1week' | '1month' | '1year';

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: Column;
    setColumn: (c: Column) => void;
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
    stats: Record<Column, Stat>;
    loading: boolean;
    error: string | null;
    logs: string[];
    peakLimits: Record<string, number>;
    setPeakLimits: (p: Record<string, number>) => void;

    startAt?: string | null;
    endAt?: string | null;
    setStartAt?: (v: string | null) => void;
    setEndAt?: (v: string | null) => void;
    setRelativeRange?: (minutes: number) => void;
    isRangeMode?: boolean;

    panLeft?: () => void;
    panRight?: () => void;
    totalEnergy?: number | null; // ✅ 추가
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
    total_energy: '총 누적 전력량 (kWh)', // ✅ 추가
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
    startAt,
    endAt,
    setStartAt,
    setEndAt,
    setRelativeRange,
    isRangeMode,
    panLeft,
    panRight,
    totalEnergy, // ✅ 추가
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

    const currentStat = stats[column];
    const last = data?.length ? data[data.length - 1] : null;
    const prev = data?.length > 1 ? data[data.length - 2] : null;
    const currentValue = (last?.[column] ?? null) as number | null;
    const previousValue = (prev?.[column] ?? null) as number | null;
    const delta = currentValue != null && previousValue != null ? currentValue - previousValue : 0;
    const changePct =
        previousValue && Number.isFinite(previousValue)
            ? `${((delta / previousValue) * 100 || 0).toFixed(2)}%`
            : '0.00%';
    const fmt = (v: number | null, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '-');

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

    const clearRange = () => {
        setStartAt?.(null);
        setEndAt?.(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Stats - 총 전력량 카드 추가 */}
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

                    {/* ✅ 총 누적 전력량 카드 추가 */}
                    <div
                        className={styles.statCard}
                        style={{
                            gridColumn: 'span 2',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: '2px solid #764ba2',
                        }}
                    >
                        <div className={styles.statLabel} style={{ color: '#fff', fontSize: '0.9rem' }}>
                            🔋 전력량(kWh)
                        </div>
                        <div className={styles.statValue} style={{ color: '#fff', fontSize: '2rem' }}>
                            {typeof totalEnergy === 'number' ? `${totalEnergy.toFixed(2)} kWh` : '데이터 없음'}
                        </div>
                    </div>
                </div>

                {/* Controls: ZoomPanControls 사용 */}
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

                    {/* small extra controls for device/column/peak limit */}
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
                            <label>측정 항목</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value as Column)}>
                                <optgroup label="🔌 전력">
                                    <option value="active_power">유효전력 (kW)</option>
                                    <option value="reactive_power">무효전력 (kVAR)</option>
                                    <option value="apparent_power">피상전력 (kVA)</option>
                                </optgroup>
                                <optgroup label="📈 전력량">
                                    {/* <option value="active_energy">유효전력량 (kWh)</option> */}
                                    <option value="total_energy">전력량 (kWh)</option> {/* ✅ 추가 */}
                                    {/* <option value="reactive_energy">무효전력량 (kVArh)</option> */}
                                    {/* <option value="apparent_energy">피상전력량 (kVAh)</option> */}
                                </optgroup>
                                <optgroup label="⚡ 전압">
                                    <option value="voltage_ll">선간전압 (V)</option>
                                    <option value="voltage_ln">상전압 (V)</option>
                                </optgroup>
                                <optgroup label="🔋 전류 & 역률">
                                    <option value="current">전류 (A)</option>
                                    <option value="power_factor">역률</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className={styles.controlGroup}>
                            <label>임계값</label>
                            <input
                                type="number"
                                step="0.1"
                                value={currentPeakLimit ?? ''}
                                onChange={(e) => handlePeakLimitChange(e.target.value)}
                                placeholder="예: 10.0"
                                style={{
                                    background: '#2b2f36',
                                    border: '1px solid #2a3441',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    color: '#f7f8fa',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    marginBottom: '4px',
                                    width: '100px',
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

                {/* Range mode indicator */}
                <div style={{ marginBottom: 8 }}>
                    {isRangeMode ? (
                        <div style={{ color: '#f59e0b' }}>
                            범위 모드: 수동 기간({startAt} ~ {endAt}) — 실시간 폴링 비활성
                        </div>
                    ) : (
                        <div style={{ color: '#94a3b8' }}>실시간/프리셋 모드</div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div style={{ padding: 12, background: '#f87171', color: '#fff', borderRadius: 8 }}>{error}</div>
                )}

                {/* Chart */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        <div className={styles.chartTitle}>{LABELS[column]}</div>
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
                        labels={{ [column]: LABELS[column] }}
                        xKey="bucket"
                        zoomLevel={zoomLevel}
                        preset={preset}
                        peakLimit={currentPeakLimit}
                        peakLimitLabel={currentPeakLimit ? `${LABELS[column]} 임계값: ${currentPeakLimit}` : undefined}
                        onDataPointClick={onDataPointClick}
                        csvExport={{
                            apiPath: '/data/modbus/query',
                            extraParams: {
                                deviceid: deviceId,
                                preset,
                                start: startAt ? new Date(startAt).toISOString() : undefined,
                                end: endAt ? new Date(endAt).toISOString() : undefined,
                            },
                            filePrefix: `modbus-${deviceId}-${column}-${zoomLabel}`,
                        }}
                        height={420}
                    />
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                    <div className={styles.logPanel}>
                        <div className={styles.logHeader}>📜 Activity Log</div>
                        {logs.slice(-10).map((logItem, i) => (
                            <div key={i} className={styles.logItem}>
                                {logItem}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
