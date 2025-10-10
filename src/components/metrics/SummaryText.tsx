/**
 * 요약 텍스트 컴포넌트
 *
 * 데이터 요약 텍스트 표시
 */

import React from 'react';
import styles from './SummaryText.module.css';

interface SummaryTextProps {
    /**
     * 요약 제목
     */
    title: string;

    /**
     * 요약 내용
     */
    content: string;

    /**
     * 추가 정보 (선택)
     */
    info?: string;
}

export const SummaryText: React.FC<SummaryTextProps> = ({ title, content, info }) => {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.content}>{content}</p>
            {info && <p className={styles.info}>{info}</p>}
        </div>
    );
};
