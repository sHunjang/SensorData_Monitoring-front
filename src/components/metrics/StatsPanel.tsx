/**
 * 통계 패널 컴포넌트
 *
 * 평균, 최대, 최소값 등 통계 표시
 */

import React from 'react';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
    /**
     * 통계 데이터
     */
    stats: {
        label: string;
        value: number | string;
        unit?: string;
    }[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
    return (
        <div className={styles.container}>
            {stats.map((stat, index) => (
                <div key={index} className={styles.statItem}>
                    <div className={styles.label}>{stat.label}</div>
                    <div className={styles.value}>
                        {typeof stat.value === 'number' ? stat.value.toFixed(2) : stat.value}
                        {stat.unit && <p className={styles.unit}> {stat.unit}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};
