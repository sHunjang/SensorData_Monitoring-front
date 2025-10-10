/**
 * 탭 컴포넌트
 */

import React from 'react';

interface TabsProps {
    /**
     * 탭 목록
     */
    tabs: string[];

    /**
     * 현재 활성 탭 인덱스
     */
    activeTab: number;

    /**
     * 탭 변경 콜백
     */
    onTabChange: (index: number) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div style={{ display: 'flex', borderBottom: '2px solid #ddd' }}>
            {tabs.map((tab, index) => (
                <button
                    key={index}
                    onClick={() => onTabChange(index)}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: activeTab === index ? '#1976d2' : 'transparent',
                        color: activeTab === index ? 'white' : '#666',
                        border: 'none',
                        borderBottom: activeTab === index ? '2px solid #1976d2' : 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: activeTab === index ? 'bold' : 'normal',
                    }}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};
