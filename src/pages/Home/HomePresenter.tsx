/**
 * HomePresenter.tsx
 * - 목적: 홈 대시보드의 요약 카드(UI)를 보여줍니다.
 * - 스타일: HomePresenter.module.css을 사용합니다.
 * - 주석은 다른 개발자가 빠르게 이해하도록 한국어로 상세히 추가했습니다.
 */

import React from 'react';
import styles from './HomePresenter.module.css';
import { Error } from '@/components/common/Error'; // 프로젝트의 공용 Error 컴포넌트 사용

type Props = {
    power: number | null; // kW
    todayKwh: number | null; // kWh
    temperature: number | null; // °C
    humidity: number | null; // %
    solar: number | null; // W/m²
    powerError: string | null;
    todayError: string | null;
    envError: string | null;
    solarError: string | null;
};

/**
 * 숫자 포맷 헬퍼
 * - 숫자가 유효하면 고정 소수점 문자열 반환
 * - 아니면 '-' 반환
 */
const fmt = (v: number | null | undefined, digits = 2): string =>
    typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

/**
 * 전력 상태 판정 (간단 룰)
 * - UI에 색상/아이콘/상태 텍스트를 제공
 */
function getPowerStatus(power: number | null) {
    if (power == null) return { color: '#848e9c', icon: '🔌', label: '대기' };
    if (power >= 15) return { color: '#f6465d', icon: '⚡', label: '고부하' };
    if (power >= 8) return { color: '#f7931e', icon: '🔋', label: '정상' };
    if (power >= 3) return { color: '#0ecb81', icon: '💡', label: '저부하' };
    return { color: '#848e9c', icon: '⏸️', label: '미미' };
}

/**
 * 환경 상태 판정 (온도/습도 기반)
 */
function getEnvStatus(temp: number | null, hum: number | null) {
    if (temp == null || hum == null) return { color: '#848e9c', icon: '🌡️', label: '측정중' };
    if (temp >= 25 && temp <= 28 && hum >= 40 && hum <= 60) return { color: '#0ecb81', icon: '🌿', label: '최적' };
    if (temp >= 30 || hum >= 70) return { color: '#f6465d', icon: '🔥', label: '주의' };
    if (temp <= 18 || hum <= 30) return { color: '#17a2b8', icon: '❄️', label: '건조' };
    return { color: '#f7931e', icon: '⚠️', label: '보통' };
}

/**
 * 일사량 상태 판정
 */
function getSolarStatus(solar: number | null) {
    if (solar == null) return { color: '#848e9c', icon: '☀️', label: '측정중' };
    if (solar >= 800) return { color: '#0ecb81', icon: '🌞', label: '매우 좋음' };
    if (solar >= 500) return { color: '#f7931e', icon: '🌤️', label: '좋음' };
    if (solar >= 200) return { color: '#17a2b8', icon: '⛅', label: '보통' };
    return { color: '#f6465d', icon: '☁️', label: '낮음' };
}

export default function HomePresenter(props: Props) {
    const { power, todayKwh, temperature, humidity, solar, powerError, todayError, envError, solarError } = props;

    const powerStatus = getPowerStatus(power);
    const envStatus = getEnvStatus(temperature, humidity);
    const solarStatus = getSolarStatus(solar);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* 헤더: 실시간 전력 요약을 헤더 우측에 노출 */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>📊 SYSTEM DASHBOARD</h1>
                        <div className={styles.subtitle}>Real-time Monitoring · 센서 요약</div>
                    </div>

                    <div className={styles.priceInfo}>
                        <h2 className={styles.currentPrice}>
                            {fmt(power, 2)} <span style={{ fontSize: 16 }}>kW</span>
                        </h2>
                        <div className={styles.priceChange} style={{ color: powerStatus.color }}>
                            <span>{powerStatus.icon}</span>
                            <span style={{ marginLeft: 6 }}>{powerStatus.label}</span>
                        </div>
                    </div>
                </div>

                {/* 2x2 카드 그리드 */}
                <div className={styles.dashboardGrid}>
                    {/* 실시간 전력 */}
                    <div className={`${styles.card} ${styles.powerCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>⚡</div>
                            <div className={styles.cardTitle}>실시간 전력</div>
                            <div className={styles.cardStatus} style={{ color: powerStatus.color }}>
                                {powerStatus.icon} {powerStatus.label}
                            </div>
                        </div>

                        {powerError ? (
                            <Error msg={powerError} />
                        ) : (
                            <div className={styles.cardContent}>
                                <div className={styles.cardValue} style={{ color: powerStatus.color }}>
                                    {fmt(power, 2)}
                                </div>
                                <div className={styles.cardUnit}>kW</div>
                            </div>
                        )}
                    </div>

                    {/* 오늘 전력량 */}
                    <div className={`${styles.card} ${styles.energyCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>📈</div>
                            <div className={styles.cardTitle}>오늘 전력량</div>
                            <div className={styles.cardStatus}>누적값</div>
                        </div>

                        {todayError ? (
                            <Error msg={todayError} />
                        ) : (
                            <div className={styles.cardContent}>
                                <div className={styles.cardValue} style={{ color: '#0ecb81' }}>
                                    {fmt(todayKwh, 2)}
                                </div>
                                <div className={styles.cardUnit}>kWh</div>
                            </div>
                        )}
                    </div>

                    {/* 환경 센서 */}
                    <div className={`${styles.card} ${styles.envCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>🌡️</div>
                            <div className={styles.cardTitle}>환경 센서</div>
                            <div className={styles.cardStatus} style={{ color: envStatus.color }}>
                                {envStatus.icon} {envStatus.label}
                            </div>
                        </div>

                        {envError ? (
                            <Error msg={envError} />
                        ) : (
                            <div className={styles.cardContent}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                                    <div>
                                        <div className={styles.cardValue} style={{ color: envStatus.color }}>
                                            {fmt(temperature, 1)}
                                        </div>
                                        <div className={styles.cardUnit}>°C</div>
                                    </div>
                                    <div>
                                        <div className={styles.cardValue} style={{ color: envStatus.color }}>
                                            {fmt(humidity, 1)}
                                        </div>
                                        <div className={styles.cardUnit}>%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 태양광 일사량 */}
                    <div className={`${styles.card} ${styles.solarCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>☀️</div>
                            <div className={styles.cardTitle}>태양광 일사량</div>
                            <div className={styles.cardStatus} style={{ color: solarStatus.color }}>
                                {solarStatus.icon} {solarStatus.label}
                            </div>
                        </div>

                        {solarError ? (
                            <Error msg={solarError} />
                        ) : (
                            <div className={styles.cardContent}>
                                <div className={styles.cardValue} style={{ color: solarStatus.color }}>
                                    {fmt(solar, 0)}
                                </div>
                                <div className={styles.cardUnit}>W/m²</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 시스템 상태 바 */}
                <div className={styles.statusBar}>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: powerStatus.color }} />
                        <span>전력 시스템: {powerStatus.label}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: envStatus.color }} />
                        <span>환경 시스템: {envStatus.label}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: solarStatus.color }} />
                        <span>태양광 시스템: {solarStatus.label}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: '#0ecb81' }} />
                        <span>시스템 연결: 정상</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
