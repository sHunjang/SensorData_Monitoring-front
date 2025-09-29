// src/pages/Env/EnvPresenter.tsx

/**
 * EnvPresenter - 환경센서 모니터링 UI 컴포넌트
 *
 * 주요 기능:
 * 1. 주식 거래 스타일의 다크 테마 UI (그린 색상 체계)
 * 2. 실시간 온습도 값 표시 (상단 헤더)
 * 3. 계층적 차트 (주간 → 일간 드릴다운)
 * 4. 환경센서 특화 통계 카드 (온도/습도/쾌적도)
 * 5. 쾌적도 지수 계산 및 표시
 * 6. 시스템 활동 로그 표시
 * 7. 백엔드 env_router.py 데이터와 완벽 연동
 */

import React from 'react';
import styles from './Env.module.css';
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

export default function EnvPresenter({
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
     * 최신 데이터 포인트에서 현재 온습도 추출
     * - 차트 데이터의 마지막 항목을 현재값으로 사용
     * - 백엔드 env_router.py의 필드명과 정확히 매칭
     */
    const last = data?.length ? data[data.length - 1] : null;

    // 현재 온도 값 (백엔드 필드명: temperature)
    const currentTemp = last?.temperature ?? null;
    // 현재 습도 값 (백엔드 필드명: humidity)
    const currentHumidity = last?.humidity ?? null;

    // 이전 값들 (변화량 계산용)
    const previousData = data?.length > 1 ? data[data.length - 2] : null;
    const previousTemp = previousData?.temperature ?? 0;
    const previousHumidity = previousData?.humidity ?? 0;

    /**
     * 온도 변화량 및 퍼센트 계산
     */
    const tempChange = currentTemp && previousTemp ? currentTemp - previousTemp : 0;
    const tempChangePercent = previousTemp ? ((tempChange / previousTemp) * 100).toFixed(2) : '0.00';

    // ============= UI 헬퍼 함수 =============

    /**
     * 시간 범위 버튼 설정
     * - 환경센서 모니터링에 적합한 시간 프레임
     */
    const timeframes: { label: string; value: Preset }[] = [
        { label: '15m', value: '15m' },
        { label: '1h', value: '1h' },
        { label: '1d', value: '1d' },
        { label: '1w', value: '1w' },
        { label: '1mo', value: '1mo' },
    ];

    /**
     * 온도 상태 판정
     * - 현재 온도 값에 따른 상태 메시지와 색상
     */
    const getTempStatus = (temp: number | null) => {
        if (!temp) return { text: '측정 중', color: '#94a3b8', icon: '🌡️' };
        if (temp >= 30) return { text: '높음', color: '#f87171', icon: '🔥' };
        if (temp >= 20) return { text: '적정', color: '#4ade80', icon: '✅' };
        if (temp >= 10) return { text: '서늘', color: '#60a5fa', icon: '❄️' };
        return { text: '낮음', color: '#a78bfa', icon: '🧊' };
    };

    /**
     * 습도 상태 판정
     * - 현재 습도 값에 따른 상태 메시지와 색상
     */
    const getHumidityStatus = (humidity: number | null) => {
        if (!humidity) return { text: '측정 중', color: '#94a3b8', icon: '💧' };
        if (humidity >= 70) return { text: '높음', color: '#f87171', icon: '🌊' };
        if (humidity >= 40) return { text: '적정', color: '#4ade80', icon: '💚' };
        if (humidity >= 20) return { text: '건조', color: '#fbbf24', icon: '🏜️' };
        return { text: '매우건조', color: '#f87171', icon: '🔥' };
    };

    /**
     * 쾌적도 지수 계산
     * - 온도와 습도를 기반으로 한 종합 쾌적도
     * - 18-26°C, 40-60% 습도가 최적 조건
     */
    const getComfortIndex = (temp: number | null, humidity: number | null) => {
        if (!temp || !humidity) return { score: 0, text: '측정 중', color: '#94a3b8' };

        // 쾌적도 계산 로직 (0-100점)
        let score = 100;

        // 온도 점수 (18-26°C가 최적)
        if (temp < 18) score -= (18 - temp) * 3;
        else if (temp > 26) score -= (temp - 26) * 3;

        // 습도 점수 (40-60%가 최적)
        if (humidity < 40) score -= (40 - humidity) * 2;
        else if (humidity > 60) score -= (humidity - 60) * 2;

        score = Math.max(0, Math.min(100, score));

        if (score >= 80) return { score, text: '매우쾌적', color: '#4ade80' };
        if (score >= 60) return { score, text: '쾌적', color: '#22c55e' };
        if (score >= 40) return { score, text: '보통', color: '#fbbf24' };
        if (score >= 20) return { score, text: '불쾌적', color: '#f59e0b' };
        return { score, text: '매우불쾌적', color: '#f87171' };
    };

    const tempStatus = getTempStatus(currentTemp);
    const humidityStatus = getHumidityStatus(currentHumidity);
    const comfortIndex = getComfortIndex(currentTemp, currentHumidity);

    // ============= UI 렌더링 =============

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* ============= 트레이딩 스타일 헤더 ============= */}
                <div className={styles.header}>
                    <div>
                        {/* 환경센서 심볼처럼 표시 (ENV-21 형태) */}
                        <h1 className={styles.title}>🌿 ENV-{deviceId}</h1>
                        <div className={styles.subtitle}>Environmental Monitor • Real-time</div>
                    </div>

                    <div className={styles.priceInfo}>
                        {/* 현재 온도를 주식 가격처럼 크게 표시 */}
                        <h2 className={styles.currentPrice}>{currentTemp?.toFixed(1) || '0.0'}°C</h2>

                        {/* 변화량 및 퍼센트 (색상으로 증감 표시) */}
                        <div className={`${styles.priceChange} ${tempChange < 0 ? styles.priceChangeNegative : ''}`}>
                            <span>{tempStatus.icon}</span>
                            <span>{tempChangePercent}%</span>
                            <span>
                                ({tempChange >= 0 ? '+' : ''}
                                {tempChange.toFixed(1)})
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============= 환경 데이터 카드 그리드 ============= */}
                <div className={styles.envGrid}>
                    {/* 온도 카드 */}
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>🌡️</span>
                            <span>온도</span>
                        </div>
                        <div className={styles.envValue}>
                            {currentTemp?.toFixed(1) || '0.0'}
                            <span className={styles.envUnit}>°C</span>
                        </div>
                        <div className={styles.envStatus} style={{ color: tempStatus.color }}>
                            {tempStatus.text}
                        </div>
                    </div>

                    {/* 습도 카드 */}
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>💧</span>
                            <span>습도</span>
                        </div>
                        <div className={styles.envValue}>
                            {currentHumidity?.toFixed(1) || '0.0'}
                            <span className={styles.envUnit}>%</span>
                        </div>
                        <div className={styles.envStatus} style={{ color: humidityStatus.color }}>
                            {humidityStatus.text}
                        </div>
                    </div>

                    {/* 쾌적도 지수 카드 */}
                    <div className={styles.envCard}>
                        <div className={styles.envHeader}>
                            <span className={styles.envIcon}>😊</span>
                            <span>쾌적도</span>
                        </div>
                        <div className={styles.envValue}>
                            {Math.round(comfortIndex.score)}
                            <span className={styles.envUnit}>/100</span>
                        </div>
                        <div className={styles.envStatus} style={{ color: comfortIndex.color }}>
                            {comfortIndex.text}
                        </div>
                    </div>
                </div>

                {/* ============= 컨트롤 패널 ============= */}
                <div className={styles.controls}>
                    <div className={styles.controlsGrid}>
                        {/* 장치 선택 드롭다운 */}
                        <div className={styles.controlGroup}>
                            <label>Env Device</label>
                            <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                                {deviceOptions.map((id) => (
                                    <option key={id} value={id}>
                                        Environment {id}
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
                        <div className={styles.chartTitle}>🌿 환경 모니터링</div>

                        {/* 데이터 포인트 개수 및 현재 상태 */}
                        <div className={styles.chartControls}>
                            <span
                                style={{
                                    fontSize: '11px',
                                    color: comfortIndex.color,
                                    fontWeight: '600',
                                }}
                            >
                                쾌적도: {comfortIndex.text} • {data.length} Datas
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
                                keys={['temperature', 'humidity']} // 온도, 습도 동시 표시
                                labels={{
                                    temperature: '온도 (°C)',
                                    humidity: '습도 (%)',
                                    temp: '온도 (°C)',
                                    hum: '습도 (%)',
                                }}
                                xKey="bucket"
                                csvExport={{
                                    // CSV 다운로드 설정
                                    apiPath: '/api/env',
                                    extraParams: { deviceId },
                                    filePrefix: `env-device-${deviceId}`,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* ============= 환경 특화 통계 카드 그리드 ============= */}
                <div className={styles.statsGrid}>
                    {/* 평균 온도 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Avg Temp</div>
                        <div className={styles.statValue}>{stats?.temperature?.avg?.toFixed(1) || '0.0'}</div>
                        <div className={styles.statChange}>°C (온도)</div>
                    </div>

                    {/* 평균 습도 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Avg Humidity</div>
                        <div className={styles.statValue}>{stats?.humidity?.avg?.toFixed(1) || '0.0'}</div>
                        <div className={styles.statChange}>% (습도)</div>
                    </div>

                    {/* 최고 온도 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Max Temp</div>
                        <div className={styles.statValue}>{stats?.temperature?.max?.toFixed(1) || '0.0'}</div>
                        <div className={styles.statChange}>최고온도</div>
                    </div>

                    {/* 최저 온도 카드 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Min Temp</div>
                        <div className={styles.statValue}>{stats?.temperature?.min?.toFixed(1) || '0.0'}</div>
                        <div className={styles.statChange}>최저온도</div>
                    </div>

                    {/* 습도 변화폭 
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Humidity Range</div>
                        <div className={styles.statValue}>
                            {stats?.humidity?.max && stats?.humidity?.min
                                ? (stats.humidity.max - stats.humidity.min).toFixed(1)
                                : '0.0'}
                        </div>
                        <div className={styles.statChange}>변화폭</div>
                    </div>
                    */}

                    {/* 데이터 포인트 개수 */}
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Data Points</div>
                        <div className={styles.statValue}>{stats?.temperature?.count || '0'}</div>
                        <div className={styles.statChange}>측정 갯수</div>
                    </div>
                </div>

                {/* ============= 시스템 로그 패널 ============= */}
                <div className={styles.logPanel}>
                    <div className={styles.logHeader}>🌿 Environmental System Activity</div>

                    {/* 최근 15개 로그만 표시 */}
                    {logs.slice(-15).map((log, idx) => (
                        <div key={idx} className={styles.logItem}>
                            {log}
                        </div>
                    ))}

                    {/* 로그가 없을 때 표시 */}
                    {logs.length === 0 && <div className={styles.logItem}>No recent environmental activity</div>}
                </div>
            </div>
        </div>
    );
}
