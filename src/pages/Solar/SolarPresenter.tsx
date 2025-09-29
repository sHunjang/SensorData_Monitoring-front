// src/pages/Solar/SolarPresenter.tsx

/**
 * SolarPresenter - 태양광 일사량 모니터링 UI 컴포넌트
 *
 * 주요 기능:
 * 1. 주식 거래 스타일의 다크 테마 UI (오렌지 색상 체계)
 * 2. 실시간 일사량 값 표시 (상단 헤더)
 * 3. 계층적 차트 (주간 → 일간 드릴다운)
 * 4. 태양광 특화 통계 카드 (현재/평균/최대/최소값)
 * 5. 일사량 효율성 계산 및 표시
 * 6. 시스템 활동 로그 표시
 * 7. 백엔드 solar_router.py 데이터와 완벽 연동
 */

import React from 'react';
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Error from '@/components/common/Error';

// Preset 타입 정의 - Container와 동일하게 맞춰야 함
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

// Props 타입 정의 (Container에서 전달받는 데이터)
type Props = {
    // 장치 관리
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];

    // 시간 범위 및 모드
    preset: Preset;
    setPreset: (p: Preset) => void;
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;

    // 액션
    onQuery: () => Promise<void> | void;

    // 데이터
    data: any[];
    stats: any;
    error: string | null;
    logs: string[];
};

export default function SolarPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    preset,
    setPreset,
    mode,
    setMode,
    onQuery,
    data,
    stats,
    error,
    logs,
}: Props) {
    // ============= 실시간 값 계산 =============

    /**
     * 최신 데이터 포인트에서 현재 일사량 추출
     * - 차트 데이터의 마지막 항목을 현재값으로 사용
     * - 여러 필드명 시도 (API 스펙 변경 대응)
     * - 백엔드 solar_router.py 응답 구조와 매칭
     */
    const last = data?.length ? data[data.length - 1] : null;
    const currentValue = last?.irradiance_w_per_m2 ?? last?.irradiance ?? last?.solar ?? last?.value ?? null;
    const previousValue =
        data?.length > 1
            ? data[data.length - 2]?.irradiance_w_per_m2 ??
              data[data.length - 2]?.irradiance ??
              data[data.length - 2]?.solar ??
              0
            : 0;

    /**
     * 전일 대비 변화량 및 퍼센트 계산
     * - 양수: 증가 (태양 아이콘 ☀️ 표시)
     * - 음수: 감소 (구름 아이콘 ☁️ 표시)
     */
    const change = currentValue && previousValue ? currentValue - previousValue : 0;
    const changePercent = previousValue ? ((change / previousValue) * 100).toFixed(2) : '0.00';

    // ============= UI 헬퍼 함수 =============

    /**
     * 시간 범위 버튼 설정
     * - 태양광 모니터링에 적합한 시간 프레임
     */
    const timeframes: { label: string; value: Preset }[] = [
        { label: '15m', value: '15m' },
        { label: '1h', value: '1h' },
        { label: '1d', value: '1d' },
        { label: '1w', value: '1w' },
        { label: '1mo', value: '1mo' },
    ];

    /**
     * 일사량 상태 판정
     * - 현재 일사량 값에 따른 상태 메시지와 색상
     * - 태양광 발전 효율성 기준
     */
    const getSolarStatus = (value: number | null) => {
        if (!value) return { text: '측정 중', color: '#a78460', icon: '🌡️' };
        if (value >= 800) return { text: '매우 좋음', color: '#4ade80', icon: '☀️' };
        if (value >= 500) return { text: '좋음', color: '#fbbf24', icon: '🌤️' };
        if (value >= 200) return { text: '보통', color: '#f59e0b', icon: '⛅' };
        return { text: '낮음', color: '#f87171', icon: '☁️' };
    };

    /**
     * 태양광 효율성 계산
     * - 일사량을 기준으로 한 발전 효율성 추정
     * - 1000 W/m²를 100% 기준으로 계산
     */
    const getSolarEfficiency = (irradiance: number | null) => {
        if (!irradiance) return 0;
        return Math.min(Math.round((irradiance / 1000) * 100), 100);
    };

    const solarStatus = getSolarStatus(currentValue);
    const solarEfficiency = getSolarEfficiency(currentValue);

    // ============= UI 렌더링 =============

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* ============= 트레이딩 스타일 헤더 ============= */}
                <div className={styles.header}>
                    <div>
                        {/* 태양광 심볼처럼 표시 (SOL-31 형태) */}
                        <h1 className={styles.title}>☀️ SOL-{deviceId}</h1>
                        <div className={styles.subtitle}>Solar Irradiance • Real-time</div>
                    </div>

                    <div className={styles.priceInfo}>
                        {/* 현재 일사량을 주식 가격처럼 크게 표시 */}
                        <h2 className={styles.currentPrice}>{currentValue?.toFixed(1) || '0.0'} W/m²</h2>

                        {/* 변화량 및 퍼센트 (색상으로 증감 표시) */}
                        <div className={`${styles.priceChange} ${change < 0 ? styles.priceChangeNegative : ''}`}>
                            <span>{change >= 0 ? '☀️' : '☁️'}</span>
                            <span>{changePercent}%</span>
                            <span>
                                ({change >= 0 ? '+' : ''}
                                {change.toFixed(1)})
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============= 컨트롤 패널 ============= */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        {/* 장치 선택 드롭다운 */}
                        <div className={styles.controlGroup}>
                            <label>Solar Device</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        Solar {id}
                                    </option>
                                ))}
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
                                {timeframes.map((tf) => (
                                    <option key={tf.value} value={tf.value}>
                                        {tf.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 수동 새로고침 버튼 */}
                        <div className={styles.controlGroup}>
                            <label>&nbsp;</label>
                            <button onClick={onQuery}>🔄 Refresh</button>
                        </div>
                    </div>
                </div>

                {/* ============= 메인 차트 영역 ============= */}
                <div className={styles.chartSection}>
                    <div className={styles.chartToolbar}>
                        {/* 차트 제목 */}
                        <div className={styles.chartTitle}>☀️ 일사량 분석</div>

                        {/* 데이터 포인트 개수 및 현재 상태 */}
                        <div className={styles.chartControls}>
                            <span
                                style={{
                                    fontSize: '11px',
                                    color: solarStatus.color,
                                    fontWeight: '600',
                                }}
                            >
                                {solarStatus.text} • {data.length} Datas
                            </span>
                        </div>
                    </div>

                    {/* 에러 메시지 표시 */}
                    {error && <Error msg={error} />}

                    {/* 드릴다운 가능한 시계열 차트 */}
                    {!error && (
                        <div style={{ height: 'calc(100% - 60px)' }}>
                            <LineChartWrapper
                                data={data}
                                keys={['irradiance_w_per_m2']} // 일사량 데이터 키
                                labels={{
                                    irradiance_w_per_m2: '일사량 (W/m²)',
                                    irradiance: '일사량 (W/m²)',
                                    solar: '일사량 (W/m²)',
                                    value: '일사량 (W/m²)',
                                }}
                                xKey="bucket"
                                csvExport={{
                                    // CSV 다운로드 설정
                                    apiPath: '/api/solar',
                                    extraParams: { deviceId },
                                    filePrefix: `solar-device-${deviceId}`,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* ============= 태양광 특화 통계 카드 그리드 ============= */}
                <div className={styles.statsGrid}>
                    {/* 현재 일사량 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Current</div>
                        <div className={styles.statValue}>{currentValue?.toFixed(1) || '0.0'}</div>
                        <div className={`${styles.statChange} ${change < 0 ? styles.statChangeNegative : ''}`}>
                            {change >= 0 ? '+' : ''}
                            {change.toFixed(1)} W/m²
                        </div>
                    </div>

                    {/* 평균 일사량 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Average</div>
                        <div className={styles.statValue}>
                            {stats?.irradiance?.avg?.toFixed(1) || stats?.solar?.avg?.toFixed(1) || '0.0'}
                        </div>
                        <div className={styles.statChange}>평균 W/m²</div>
                    </div>

                    {/* 최대 일사량 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Peak</div>
                        <div className={styles.statValue}>
                            {stats?.irradiance?.max?.toFixed(1) || stats?.solar?.max?.toFixed(1) || '0.0'}
                        </div>
                        <div className={styles.statChange}>최고값</div>
                    </div>

                    {/* 최소 일사량 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Minimum</div>
                        <div className={styles.statValue}>
                            {stats?.irradiance?.min?.toFixed(1) || stats?.solar?.min?.toFixed(1) || '0.0'}
                        </div>
                        <div className={styles.statChange}>최저값</div>
                    </div>

                    {/* 태양광 효율 예상
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Efficiency</div>
                        <div className={styles.statValue}>{solarEfficiency}%</div>
                        <div className={styles.statChange}>예상 효율</div>
                    </div>
                    */}

                    {/* 데이터 포인트 개수 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Data Points</div>
                        <div className={styles.statValue}>{stats?.irradiance?.count || stats?.solar?.count || '0'}</div>
                        <div className={styles.statChange}>측정 횟수</div>
                    </div>
                </div>

                {/* ============= 시스템 로그 패널 ============= */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>☀️ Solar System Activity</div>

                    {/* 최근 15개 로그만 표시 */}
                    {logs.slice(-15).map((log, idx) => (
                        <div key={idx} className={styles.logItem}>
                            {log}
                        </div>
                    ))}

                    {/* 로그가 없을 때 표시 */}
                    {logs.length === 0 && <div className={styles.logItem}>No recent solar activity</div>}
                </div>
            </div>
        </div>
    );
}
