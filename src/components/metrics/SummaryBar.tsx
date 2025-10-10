/**
 * 요약 바 컴포넌트
 *
 * 주요 지표를 요약해서 표시하는 바
 */

import React from 'react';
import styles from './SummaryBar.module.css';

interface SummaryBarProps {
    /**
     * 요약 항목 목록
     */
    items: {
        label: string;
        value: string | number;
        unit?: string;
        trend?: 'up' | 'down' | 'neutral';
    }[];
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ items }) => {
    const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
        if (trend === 'up') return '▲';
        if (trend === 'down') return '▼';
        return '−';
    };

    const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
        if (trend === 'up') return '#4caf50';
        if (trend === 'down') return '#f44336';
        return '#999';
    };

    return (
        <div className={styles.container}>
            {items.map((item, index) => (
                <div key={index} className={styles.item}>
                    <div className={styles.label}>{item.label}</div>
                    <div className={styles.valueWrapper}>
                        <span className={styles.value}>
                            {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                        </span>
                        {item.unit && <span className={styles.unit}>{item.unit}</span>}
                        {item.trend && (
                            <span className={styles.trend} style={{ color: getTrendColor(item.trend) }}>
                                {getTrendIcon(item.trend)}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
