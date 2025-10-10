/**
 * 환경 변수 헬퍼
 */

/**
 * API 베이스 URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * 개발 모드 여부
 */
export const IS_DEV = import.meta.env.DEV;

/**
 * 프로덕션 모드 여부
 */
export const IS_PROD = import.meta.env.PROD;
