/**
 * 날짜/시간 포맷 유틸리티
 */

/**
 * 상대 시간 표시 (예: "5분 전", "2시간 전")
 */
export function getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return `${diffSeconds}초 전`;
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else {
        return `${diffDays}일 전`;
    }
}

/**
 * 시간 범위 텍스트 생성
 */
export function formatTimeRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return `${startDate.toLocaleString('ko-KR')} ~ ${endDate.toLocaleString('ko-KR')}`;
}
