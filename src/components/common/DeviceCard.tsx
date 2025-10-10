/**
 * 디바이스 카드 컴포넌트
 *
 * 디바이스 선택 카드
 */

import React from 'react';

interface DeviceCardProps {
    /**
     * 디바이스 ID
     */
    deviceId: number;

    /**
     * 디바이스 이름
     */
    name: string;

    /**
     * 선택 여부
     */
    selected: boolean;

    /**
     * 클릭 이벤트 핸들러
     */
    onClick: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ deviceId, name, selected, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '16px',
                border: selected ? '2px solid #1976d2' : '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: selected ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <div style={{ fontSize: '14px', color: '#666' }}>Device #{deviceId}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{name}</div>
        </div>
    );
};
