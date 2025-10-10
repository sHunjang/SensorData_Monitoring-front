/**
 * 로그 패널 컴포넌트
 *
 * 시스템 로그 및 메시지 표시
 */

import React from 'react';
import styles from './LogPanel.module.css';

interface LogPanelProps {
    /**
     * 로그 메시지 목록
     */
    logs: {
        timestamp: string;
        level: 'info' | 'warning' | 'error';
        message: string;
    }[];

    /**
     * 최대 로그 개수 (기본: 10)
     */
    maxLogs?: number;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, maxLogs = 10 }) => {
    const displayLogs = logs.slice(-maxLogs).reverse();

    return (
        <div className={styles.container}>
            <h3>시스템 로그</h3>
            <div className={styles.logList}>
                {displayLogs.length === 0 ? (
                    <div className={styles.empty}>로그가 없습니다.</div>
                ) : (
                    displayLogs.map((log, index) => (
                        <div key={index} className={`${styles.logItem} ${styles[log.level]}`}>
                            <span className={styles.timestamp}>{log.timestamp}</span>
                            <span className={styles.level}>[{log.level.toUpperCase()}]</span>
                            <span className={styles.message}>{log.message}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
