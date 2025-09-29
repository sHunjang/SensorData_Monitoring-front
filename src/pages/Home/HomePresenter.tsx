// src/pages/Home/HomePresenter.tsx

/**
 * HomePresenter.tsx - 프로페셔널 트레이딩 스타일 대시보드
 *
 * 🎨 완전한 트레이딩 스타일 디자인:
 * - 다크 테마 (#0b0e11 배경, #131722 카드)
 * - 트레이딩 색상 체계 (녹색/빨간색/오렌지)
 * - 주식 시세 스타일 실시간 값 표시
 * - 4개 주요 시스템 모니터링 카드
 * - 상태별 색상 및 아이콘 표시
 * - 완전 반응형 그리드 레이아웃
 *
 * 📊 모니터링 항목:
 * - 실시간 전력 (kW) - 파란색
 * - 오늘 전력량 (kWh) - 녹색
 * - 환경 센서 (온도/습도) - 오렌지
 * - 태양광 일사량 (W/m²) - 하늘색
 */

import React from 'react';
import styles from './HomePresenter.module.css';
import Error from '@/components/common/Error';

/**
 * 🔧 Props 타입 정의
 */
type Props = {
    power: number | null; // 현재 전력 (kW)
    todayKwh: number | null; // 오늘 전력량 (kWh)
    temperature: number | null; // 온도 (°C)
    humidity: number | null; // 습도 (%)
    solar: number | null; // 일사량 (W/m²)
    powerError: string | null; // 전력 에러 메시지
    todayError: string | null; // 전력량 에러 메시지
    envError: string | null; // 환경 센서 에러 메시지
    solarError: string | null; // 태양광 에러 메시지
};

/**
 * 🎨 HomePresenter 메인 컴포넌트 - 완전한 트레이딩 스타일
 */
export default function HomePresenter({
    power,
    todayKwh,
    temperature,
    humidity,
    solar,
    powerError,
    todayError,
    envError,
    solarError,
}: Props) {
    /**
     * 🔢 숫자 포맷팅 헬퍼 함수
     */
    const fmt = (v: number | null | undefined, digits = 2): string => {
        return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';
    };

    /**
     * 🎯 전력 상태 판정 함수
     */
    const getPowerStatus = (power: number | null) => {
        if (!power) return { color: '#848e9c', icon: '🔌', status: '대기' };
        if (power >= 15) return { color: '#f6465d', icon: '⚡', status: '고부하' };
        if (power >= 8) return { color: '#f7931e', icon: '🔋', status: '정상' };
        if (power >= 3) return { color: '#0ecb81', icon: '💡', status: '저부하' };
        return { color: '#848e9c', icon: '⏸️', status: '미미' };
    };

    /**
     * 🌡️ 환경 상태 판정 함수
     */
    const getEnvStatus = (temp: number | null, hum: number | null) => {
        if (!temp || !hum) return { color: '#848e9c', icon: '🌡️', status: '측정 중' };
        if (temp >= 25 && temp <= 28 && hum >= 40 && hum <= 60) {
            return { color: '#0ecb81', icon: '🌿', status: '최적' };
        }
        if (temp >= 30 || hum >= 70) return { color: '#f6465d', icon: '🔥', status: '주의' };
        if (temp <= 18 || hum <= 30) return { color: '#17a2b8', icon: '❄️', status: '건조' };
        return { color: '#f7931e', icon: '⚠️', status: '보통' };
    };

    /**
     * ☀️ 태양광 상태 판정 함수
     */
    const getSolarStatus = (solar: number | null) => {
        if (!solar) return { color: '#848e9c', icon: '🌡️', status: '측정 중' };
        if (solar >= 800) return { color: '#0ecb81', icon: '☀️', status: '매우 좋음' };
        if (solar >= 500) return { color: '#f7931e', icon: '🌤️', status: '좋음' };
        if (solar >= 200) return { color: '#17a2b8', icon: '⛅', status: '보통' };
        return { color: '#f6465d', icon: '☁️', status: '낮음' };
    };

    const powerStatus = getPowerStatus(power);
    const envStatus = getEnvStatus(temperature, humidity);
    const solarStatus = getSolarStatus(solar);

    // ============= UI 렌더링 (트레이딩 스타일) =============

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* ============= 트레이딩 스타일 헤더 ============= */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>📊 SYSTEM DASHBOARD</h1>
                        <div className={styles.subtitle}>Real-time Monitoring • Live Data</div>
                    </div>
                    <div className={styles.priceInfo}>
                        <h2 className={styles.currentPrice}>{fmt(power, 2)} kW</h2>
                        <div className={`${styles.priceChange}`} style={{ color: powerStatus.color }}>
                            <span>{powerStatus.icon}</span>
                            <span>{powerStatus.status}</span>
                        </div>
                    </div>
                </div>

                {/* ============= 2x2 대시보드 카드 그리드 ============= */}
                <div className={styles.dashboardGrid}>
                    {/* ⚡ 실시간 전력 카드 */}
                    <div className={`${styles.card} ${styles.powerCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>⚡</div>
                            <div className={styles.cardTitle}>실시간 전력</div>
                            <div className={styles.cardStatus} style={{ color: powerStatus.color }}>
                                {powerStatus.icon} {powerStatus.status}
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

                    {/* 📈 오늘 전력량 카드 */}
                    <div className={`${styles.card} ${styles.energyCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>📈</div>
                            <div className={styles.cardTitle}>오늘 전력량</div>
                            <div className={styles.cardStatus}>📊 누적값</div>
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

                    {/* 🌡️ 환경 센서 카드 */}
                    <div className={`${styles.card} ${styles.envCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>🌡️</div>
                            <div className={styles.cardTitle}>환경 센서</div>
                            <div className={styles.cardStatus} style={{ color: envStatus.color }}>
                                {envStatus.icon} {envStatus.status}
                            </div>
                        </div>

                        {envError ? (
                            <Error msg={envError} />
                        ) : (
                            <div className={styles.cardContent}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                                    <div>
                                        <div
                                            className={styles.cardValue}
                                            style={{ color: envStatus.color, fontSize: '50px' }}
                                        >
                                            {fmt(temperature, 1)}
                                        </div>
                                        <div className={styles.cardUnit}>°C</div>
                                    </div>
                                    <div>
                                        <div
                                            className={styles.cardValue}
                                            style={{ color: envStatus.color, fontSize: '50px' }}
                                        >
                                            {fmt(humidity, 1)}
                                        </div>
                                        <div className={styles.cardUnit}>%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ☀️ 태양광 일사량 카드 */}
                    <div className={`${styles.card} ${styles.solarCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>☀️</div>
                            <div className={styles.cardTitle}>태양광 일사량</div>
                            <div className={styles.cardStatus} style={{ color: solarStatus.color }}>
                                {solarStatus.icon} {solarStatus.status}
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

                {/* ============= 시스템 상태 인디케이터 ============= */}
                <div className={styles.statusBar}>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: powerStatus.color }}></span>
                        <span>전력 시스템: {powerStatus.status}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: envStatus.color }}></span>
                        <span>환경 시스템: {envStatus.status}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: solarStatus.color }}></span>
                        <span>태양광 시스템: {solarStatus.status}</span>
                    </div>
                    <div className={styles.statusItem}>
                        <span className={styles.statusDot} style={{ background: '#0ecb81' }}></span>
                        <span>시스템 연결: 정상</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
