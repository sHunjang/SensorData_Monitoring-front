/**
 * 에러 컴포넌트
 */

import React from 'react';

interface ErrorProps {
    /**
     * 에러 메시지
     */
    message: string;

    /**
     * 재시도 콜백 (선택)
     */
    onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ message, onRetry }) => {
    return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>
            <p>⚠️ 오류가 발생했습니다</p>
            <p>{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    재시도
                </button>
            )}
        </div>
    );
};
