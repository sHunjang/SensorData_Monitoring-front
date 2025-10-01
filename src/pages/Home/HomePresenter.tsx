// src/pages/Home/HomePresenter.tsx
// - 홈 요약 카드 UI: Modbus(전력/에너지), Env(온도/습도), Solar(일사량)
// - CSS 모듈 스타일 적용

import React from 'react';
import styles from './HomePresenter.module.css';

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
    const fmt = (v: number | null, digits = 2) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>센서 모니터링 시스템</h1>

            <div className={styles.grid}>
                {/* 전력 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>⚡</span>
                        <h2 className={styles.cardTitle}>현재 전력</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.value}>
                            {fmt(power, 2)}
                            <span className={styles.unit}>kW</span>
                        </div>
                        {powerError ? <div className={styles.error}>{powerError}</div> : null}
                    </div>
                </div>

                {/* 금일 에너지 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>📊</span>
                        <h2 className={styles.cardTitle}>금일 에너지</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.value}>
                            {fmt(todayKwh, 2)}
                            <span className={styles.unit}>kWh</span>
                        </div>
                        {todayError ? <div className={styles.error}>{todayError}</div> : null}
                    </div>
                </div>

                {/* 환경 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>🌡️</span>
                        <h2 className={styles.cardTitle}>환경</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.value}>
                            {fmt(temperature, 1)}
                            <span className={styles.unit}>°C</span>
                            {' / '}
                            {fmt(humidity, 1)}
                            <span className={styles.unit}>%</span>
                        </div>
                        {envError ? <div className={styles.error}>{envError}</div> : null}
                    </div>
                </div>

                {/* 태양광 카드 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>☀️</span>
                        <h2 className={styles.cardTitle}>일사량</h2>
                    </div>
                    <div className={styles.cardBody}>
                        <div className={styles.value}>
                            {fmt(solar, 2)}
                            <span className={styles.unit}>W/m²</span>
                        </div>
                        {solarError ? <div className={styles.error}>{solarError}</div> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
