/**
 * CSV 다운로드 컴포넌트
 *
 * 데이터를 CSV 파일로 다운로드
 */

import React from 'react';

interface CsvDownloaderProps {
    /**
     * CSV 데이터
     */
    data: any[];

    /**
     * CSV 헤더 (컬럼명)
     */
    headers: string[];

    /**
     * 파일명 (기본: data.csv)
     */
    filename?: string;

    /**
     * 버튼 텍스트 (기본: CSV 다운로드)
     */
    buttonText?: string;
}

export const CsvDownloader: React.FC<CsvDownloaderProps> = ({
    data,
    headers,
    filename = 'data.csv',
    buttonText = 'CSV 다운로드',
}) => {
    /**
     * CSV 문자열 생성
     */
    const generateCsv = (): string => {
        // 헤더 추가
        const csvRows: string[] = [headers.join(',')];

        // 데이터 행 추가
        for (const row of data) {
            const values = headers.map((header) => {
                const value = row[header];
                // 값이 null/undefined면 빈 문자열
                if (value === null || value === undefined) {
                    return '';
                }
                // 문자열이면 따옴표로 감싸기
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    };

    /**
     * CSV 다운로드 실행
     */
    const handleDownload = () => {
        const csvContent = generateCsv();
        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;',
        });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleDownload}
            style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
            }}
        >
            📥 {buttonText}
        </button>
    );
};
