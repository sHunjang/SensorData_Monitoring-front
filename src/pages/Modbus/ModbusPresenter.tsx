// src/pages/Modbus/ModbusPresenter.tsx

/**
 * ModbusPresenter.tsx - 프로페셔널 트레이딩 스타일 전력계 모니터링 UI
 *
 * 🎨 완전한 트레이딩 스타일 디자인:
 * - 다크 테마 (#0b0e11 배경, #131722 카드)
 * - 실시간 전력 값을 주식 가격처럼 표시
 * - 증감 색상 (녹색: 증가, 빨간색: 감소)
 * - 피크선 설정 기능 완전 통합
 * - 6개 통계 카드 (현재/평균/최대/최소/개수/피크상태)
 * - 시스템 활동 로그 (콘솔 스타일)
 * - 완전 반응형 그리드 레이아웃
 */

import React from 'react';
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';

// Preset 타입 정의 - Container와 동일하게 맞춰야 함
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

/**
 * 🔧 Props 타입 정의 (React.Dispatch 사용으로 완전 해결)
 */
type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: string;
    setColumn: (c: string) => void;
    preset: Preset;
    setPreset: (p: Preset) => void;
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    onQuery: () => Promise<void> | void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];
    peakLimits: Record<string, number>; // 🆕 피크 기준값들
    setPeakLimits: React.Dispatch<React.SetStateAction<Record<string, number>>>; // 🔧 정확한 React useState 타입
};

/**
 * 🎨 ModbusPresenter 메인 컴포넌트 - 완전한 트레이딩 스타일
 */
export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    column,
    setColumn,
    preset,
    setPreset,
    mode,
    setMode,
    onQuery,
    data,
    stats,
    loading,
    error,
    logs,
    peakLimits, // 🆕 피크 기준값들
    setPeakLimits, // 🆕 피크 값 설정 함수
}: Props) {
    // 🔄 로딩 상태 처리
    // if (loading) return <Loading />;

    // ❌ 에러 상태 처리
    if (error) return <Error msg={error} />;

    // ============= 실시간 값 계산 =============

    /**
     * 최신 데이터 포인트에서 현재 전력 값 추출
     * - 차트 데이터의 마지막 항목을 현재값으로 사용
     * - 백엔드 modbus_router.py 응답 구조와 매칭
     */
    const last = data?.length ? data[data.length - 1] : null;
    const currentValue = last?.[column] ?? null;
    const previousValue = data?.length > 1 ? data[data.length - 2]?.[column] ?? 0 : 0;

    /**
     * 전일 대비 변화량 및 퍼센트 계산
     * - 양수: 증가 (⚡ 표시)
     * - 음수: 감소 (⬇️ 표시)
     */
    const change = currentValue && previousValue ? currentValue - previousValue : 0;
    const changePercent = previousValue ? ((change / previousValue) * 100).toFixed(2) : '0.00';

    // 🎯 현재 선택된 컬럼의 피크 값
    const currentPeakLimit = peakLimits[column];

    // 🏷️ 차트 범례 라벨 정의
    const chartLabels: Record<string, string> = {
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

    // 🏷️ 컬럼별 단위 정의
    const unitLabels: Record<string, string> = {
        active_power: 'kW',
        reactive_power: 'kVAR',
        apparent_power: 'kVA',
        voltage_ll: 'V',
        voltage_ln: 'V',
        current: 'A',
        power_factor: '',
        active_energy: 'kWh',
        reactive_energy: 'kVArh',
        apparent_energy: 'kVAh',
    };

    /**
     * 🎯 전력계 상태 판정
     * - 현재 전력 값에 따른 상태 메시지와 색상
     * - 전력계 효율성 기준
     */
    const getPowerStatus = (value: number | null, columnType: string) => {
        if (!value) return { text: '측정 중', color: '#848e9c', icon: '🔌' };

        switch (columnType) {
            case 'active_power':
                if (value >= 10) return { text: '고부하', color: '#f6465d', icon: '⚡' };
                if (value >= 5) return { text: '정상부하', color: '#f7931e', icon: '🔋' };
                if (value >= 1) return { text: '저부하', color: '#0ecb81', icon: '💡' };
                return { text: '대기', color: '#848e9c', icon: '⏸️' };
            case 'voltage_ll':
            case 'voltage_ln':
                if (value >= 240) return { text: '정상전압', color: '#0ecb81', icon: '⚡' };
                if (value >= 200) return { text: '저전압', color: '#f7931e', icon: '⚠️' };
                return { text: '이상전압', color: '#f6465d', icon: '🚨' };
            case 'current':
                if (value >= 50) return { text: '고전류', color: '#f6465d', icon: '⚡' };
                if (value >= 20) return { text: '정상전류', color: '#0ecb81', icon: '🔋' };
                return { text: '저전류', color: '#f7931e', icon: '💡' };
            default:
                return { text: '측정됨', color: '#0ecb81', icon: '📊' };
        }
    };

    /**
     * 🚨 피크 값 업데이트 함수 (완전 해결됨)
     */
    const handlePeakChange = (value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            setPeakLimits((prev) => ({
                ...prev,
                [column]: numValue,
            }));
        }
    };

    /**
     * 🗑️ 피크선 제거 함수 (완전 해결됨)
     */
    const handlePeakRemove = () => {
        setPeakLimits((prev) => {
            const updated = { ...prev };
            delete updated[column];
            return updated;
        });
    };

    const powerStatus = getPowerStatus(currentValue, column);

    // ============= UI 렌더링 (트레이딩 스타일) =============

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* ============= 트레이딩 스타일 헤더 ============= */}
                <div className={styles.header}>
                    <div>
                        {/* 전력계 심볼처럼 표시 (PWR-11 형태) */}
                        <h1 className={styles.title}>⚡ PWR-{deviceId}</h1>
                        <div className={styles.subtitle}>Power Monitor • Real-time</div>
                    </div>

                    <div className={styles.priceInfo}>
                        {/* 현재 전력값을 주식 가격처럼 크게 표시 */}
                        <h2 className={styles.currentPrice}>
                            {currentValue?.toFixed(3) || '0.000'} {unitLabels[column]}
                        </h2>

                        {/* 변화량 및 퍼센트 (색상으로 증감 표시) */}
                        <div className={`${styles.priceChange} ${change < 0 ? styles.priceChangeNegative : ''}`}>
                            <span>{change >= 0 ? '⚡' : '⬇️'}</span>
                            <span>{changePercent}%</span>
                            <span>
                                ({change >= 0 ? '+' : ''}
                                {change.toFixed(3)})
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============= 메인 컨트롤 패널 ============= */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        {/* 장치 선택 드롭다운 */}
                        <div className={styles.controlGroup}>
                            <label>Power Device</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        Device {id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 데이터 컬럼 선택 */}
                        <div className={styles.controlGroup}>
                            <label>Data Type</label>
                            <select value={column} onChange={(e) => setColumn(e.target.value)}>
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

                        {/* 모니터링 모드 선택 */}
                        <div className={styles.controlGroup}>
                            <label>Mode</label>
                            <select value={mode} onChange={(e) => setMode(e.target.value as 'realtime' | 'range')}>
                                <option value="realtime">Real-time</option>
                                <option value="range">Historical</option>
                            </select>
                        </div>

                        {/* 시간 범위 선택 */}
                        <div className={styles.controlGroup}>
                            <label>Period</label>
                            <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                                <option value="15m">15m</option>
                                <option value="1h">1h</option>
                                <option value="1d">1d</option>
                                <option value="1w">1w</option>
                                <option value="1mo">1mo</option>
                            </select>
                        </div>

                        {/* 피크 값 입력 */}
                        <div className={styles.controlGroup}>
                            <label>Peak Limit ({unitLabels[column]})</label>
                            <input
                                type="number"
                                step="0.1"
                                value={currentPeakLimit || ''}
                                onChange={(e) => handlePeakChange(e.target.value)}
                                placeholder="피크 값"
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

                        {/* 수동 새로고침 + 피크 제거 버튼 */}
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={onQuery} style={{ flex: 1 }}>
                                    🔄 Refresh
                                </button>
                                {currentPeakLimit && (
                                    <button
                                        onClick={handlePeakRemove}
                                        style={{
                                            flex: 1,
                                            background: '#f6465d',
                                            borderColor: '#f6465d',
                                        }}
                                    >
                                        🗑️ Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============= 메인 차트 영역 ============= */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        {/* 차트 제목 */}
                        <div className={styles.chartTitle}>⚡ {chartLabels[column]} 분석</div>

                        {/* 데이터 포인트 개수 및 현재 상태 */}
                        <div className={styles.chartControls}>
                            <span
                                style={{
                                    fontSize: '11px',
                                    color: powerStatus.color,
                                    fontWeight: '600',
                                }}
                            >
                                {powerStatus.icon} {powerStatus.text} • {data.length} Points
                            </span>
                            {currentPeakLimit && (
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#f7931e',
                                        fontWeight: '600',
                                    }}
                                >
                                    • Peak: {currentPeakLimit} {unitLabels[column]}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 피크선 포함 차트 */}
                    <div style={{ height: 'calc(100% - 60px)' }}>
                        <LineChartWrapper
                            data={data}
                            keys={[column]}
                            labels={chartLabels}
                            xKey="bucket"
                            peakLimit={currentPeakLimit} // 🆕 피크 기준값
                            // peakLimitLabel={`${chartLabels[column]} 피크: ${currentPeakLimit || 0}`} // 🆕 피크선 라벨
                            csvExport={{
                                apiPath: '/data/modbus/query',
                                extraParams: { device_id: deviceId },
                                filePrefix: `power-device-${deviceId}`,
                            }}
                        />
                    </div>
                </div>

                {/* ============= 전력계 특화 통계 카드 그리드 ============= */}
                <div className={styles.statsGrid}>
                    {/* 현재값 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Current</div>
                        <div className={styles.statValue}>{currentValue?.toFixed(3) || '0.000'}</div>
                        <div className={`${styles.statChange} ${change < 0 ? styles.statChangeNegative : ''}`}>
                            {change >= 0 ? '+' : ''}
                            {change.toFixed(3)} {unitLabels[column]}
                        </div>
                    </div>

                    {/* 평균값 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Average</div>
                        <div className={styles.statValue}>{stats?.[column]?.avg?.toFixed(3) || '0.000'}</div>
                        <div className={styles.statChange}>평균 {unitLabels[column]}</div>
                    </div>

                    {/* 최대값 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Peak</div>
                        <div className={styles.statValue}>{stats?.[column]?.max?.toFixed(3) || '0.000'}</div>
                        <div className={styles.statChange}>최고값</div>
                    </div>

                    {/* 최소값 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Minimum</div>
                        <div className={styles.statValue}>{stats?.[column]?.min?.toFixed(3) || '0.000'}</div>
                        <div className={styles.statChange}>최저값</div>
                    </div>

                    {/* 데이터 포인트 개수 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Data Points</div>
                        <div className={styles.statValue}>{stats?.[column]?.count || '0'}</div>
                        <div className={styles.statChange}>측정 횟수</div>
                    </div>

                    {/* 피크 초과 여부 */}
                    {currentPeakLimit && (
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>Peak Status</div>
                            <div
                                className={styles.statValue}
                                style={{
                                    color: currentValue && currentValue > currentPeakLimit ? '#f6465d' : '#0ecb81',
                                }}
                            >
                                {currentValue && currentValue > currentPeakLimit ? '⚠️' : '✅'}
                            </div>
                            <div className={styles.statChange}>
                                {currentValue && currentValue > currentPeakLimit ? '피크 초과' : '정상 범위'}
                            </div>
                        </div>
                    )}
                </div>

                {/* ============= 시스템 로그 패널 ============= */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>⚡ Power System Activity</div>

                    {/* 최근 15개 로그만 표시 */}
                    {logs.slice(-15).map((log, idx) => (
                        <div key={idx} className={styles.logItem}>
                            {log}
                        </div>
                    ))}

                    {/* 로그가 없을 때 표시 */}
                    {logs.length === 0 && <div className={styles.logItem}>No recent power activity</div>}
                </div>
            </div>
        </div>
    );
}
