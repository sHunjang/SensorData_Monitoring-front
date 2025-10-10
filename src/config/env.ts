/**
 * 환경 변수 설정
 * 
 * Vite 환경변수를 읽어와 애플리케이션 전역에서 사용
 * 
 * .env 파일 설정 예시:
 * VITE_API_BASE_URL=http://localhost:8000/api
 * VITE_POLLING_INTERVAL=5000
 */

/**
 * 환경 변수 객체
 */
export const ENV = {
    /**
     * API 베이스 URL
     * 
     * 백엔드 API 서버의 기본 URL
     * 기본값: http://localhost:8000/api
     */
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

    /**
     * 폴링 간격 (밀리초)
     * 
     * 실시간 데이터 폴링 주기
     * 기본값: 5000ms (5초)
     */
    POLLING_INTERVAL: Number(import.meta.env.VITE_POLLING_INTERVAL) || 5000,

    /**
     * 개발 모드 여부
     * 
     * Vite에서 자동으로 설정
     */
    IS_DEV: import.meta.env.DEV,

    /**
     * 프로덕션 모드 여부
     * 
     * Vite에서 자동으로 설정
     */
    IS_PROD: import.meta.env.PROD,

    /**
     * 애플리케이션 모드
     * 
     * development | production | test
     */
    MODE: import.meta.env.MODE,
} as const;

/**
 * 환경 변수 타입
 */
export type EnvType = typeof ENV;

/**
 * 환경 변수 검증
 * 
 * 필수 환경 변수가 설정되어 있는지 확인
 */
export function validateEnv(): void {
    if (!ENV.API_BASE_URL) {
        console.warn('⚠️  VITE_API_BASE_URL is not set. Using default: http://localhost:8000/api');
    }

    if (ENV.IS_DEV) {
        console.log('🔧 Running in DEVELOPMENT mode');
        console.log('📡 API Base URL:', ENV.API_BASE_URL);
        console.log('⏱️  Polling Interval:', ENV.POLLING_INTERVAL, 'ms');
    }
}

// 앱 시작 시 환경 변수 검증
if (ENV.IS_DEV) {
    validateEnv();
}
