/**
 * 시간 관련 유틸리티 함수
 */

/**
 * ISO 8601 문자열을 Date 객체로 변환
 */
export function parseISODate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Date 객체를 ISO 8601 문자열로 변환
 */
export function formatISODate(date: Date): string {
  return date.toISOString();
}

/**
 * 현재 시각 (ISO 8601 문자열)
 */
export function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * N시간 전 (ISO 8601 문자열)
 */
export function getHoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * N일 전 (ISO 8601 문자열)
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * 한국 시간대 포맷 (YYYY-MM-DD HH:mm:ss)
 */
export function formatKoreanDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;

  return dateObj.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
