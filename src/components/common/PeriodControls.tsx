/**
 * 기간 컨트롤 컴포넌트
 *
 * Preset 선택 및 커스텀 날짜 범위 설정
 */

import React from 'react';
import styles from './PeriodControls.module.css';

interface PeriodControlsProps {
    /**
     * 현재 선택된 preset
     */
    preset: '1m' | '15m';

    /**
     * Preset 변경 핸들러
     */
    onPresetChange: (preset: '1m' | '15m') => void;

    /**
     * 시작 날짜 (선택)
     */
    startDate?: string;

    /**
     * 종료 날짜 (선택)
     */
    endDate?: string;

    /**
     * 날짜 변경 핸들러 (선택)
     */
    onDateChange?: (start: string, end: string) => void;
}

export const PeriodControls: React.FC<PeriodControlsProps> = ({
    preset,
    onPresetChange,
    startDate,
    endDate,
    onDateChange,
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.presetButtons}>
                <button className={preset === '1m' ? styles.active : ''} onClick={() => onPresetChange('1m')}>
                    1분
                </button>
                <button className={preset === '15m' ? styles.active : ''} onClick={() => onPresetChange('15m')}>
                    15분
                </button>
            </div>

            {onDateChange && (
                <div className={styles.dateInputs}>
                    <input
                        type="datetime-local"
                        value={startDate || ''}
                        onChange={(e) => onDateChange(e.target.value, endDate || '')}
                    />
                    <span>~</span>
                    <input
                        type="datetime-local"
                        value={endDate || ''}
                        onChange={(e) => onDateChange(startDate || '', e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};
