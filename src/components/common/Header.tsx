/**
 * 헤더 컴포넌트
 */

import React from 'react';

interface HeaderProps {
    /**
     * 헤더 제목
     */
    title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header style={{ padding: '20px', backgroundColor: '#1976d2', color: 'white' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{title}</h1>
        </header>
    );
};
