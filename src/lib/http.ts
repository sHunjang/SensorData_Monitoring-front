/**
 * HTTP 클라이언트
 * 
 * Axios 기반 HTTP 요청 래퍼
 * - 자동 베이스 URL 설정
 * - 에러 핸들링
 * - 타임아웃 설정
 * - 요청/응답 인터셉터
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ENV } from '../config/env';

// ========================================
// Axios 인스턴스 생성
// ========================================
const axiosInstance: AxiosInstance = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: 30000, // 30초
    headers: {
        'Content-Type': 'application/json',
    },
});

// ========================================
// 요청 인터셉터
// ========================================
axiosInstance.interceptors.request.use(
    (config) => {
        // 요청 전처리 (예: 인증 토큰 추가)
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

        if (ENV.IS_DEV) {
            console.log('[HTTP Request]', config.method?.toUpperCase(), config.url);
        }

        return config;
    },
    (error) => {
        console.error('[HTTP Request Error]', error);
        return Promise.reject(error);
    }
);

// ========================================
// 응답 인터셉터
// ========================================
axiosInstance.interceptors.response.use(
    (response) => {
        // 응답 전처리
        if (ENV.IS_DEV) {
            console.log('[HTTP Response]', response.status, response.config.url);
        }

        return response;
    },
    (error: AxiosError) => {
        // 에러 응답 처리
        if (error.response) {
            // 서버 응답이 있는 경우 (4xx, 5xx)
            console.error(
                '[HTTP Response Error]',
                error.response.status,
                error.response.config.url,
                error.response.data
            );

            // 특정 상태 코드별 처리
            switch (error.response.status) {
                case 401:
                    // 인증 실패
                    console.error('Unauthorized: Please login again');
                    break;
                case 403:
                    // 권한 없음
                    console.error('Forbidden: Access denied');
                    break;
                case 404:
                    // 리소스 없음
                    console.error('Not Found: Resource does not exist');
                    break;
                case 422:
                    // 유효성 검증 실패
                    console.error('Validation Error:', error.response.data);
                    break;
                case 500:
                    // 서버 에러
                    console.error('Internal Server Error');
                    break;
                case 503:
                    // 서비스 불가
                    console.error('Service Unavailable');
                    break;
                default:
                    console.error('HTTP Error:', error.response.status);
            }
        } else if (error.request) {
            // 요청은 보냈지만 응답이 없는 경우 (네트워크 에러)
            console.error('[HTTP No Response]', error.request);
            console.error('Network Error: Please check your connection');
        } else {
            // 요청 설정 중 에러 발생
            console.error('[HTTP Request Setup Error]', error.message);
        }

        return Promise.reject(error);
    }
);

// ========================================
// HTTP 메서드 함수
// ========================================

/**
 * HTTP GET 요청
 * 
 * @param url 요청 URL (상대 경로)
 * @param config Axios 설정 (선택)
 * @returns 응답 데이터
 * 
 * @example
 * const data = await httpGet<User>('/users/123');
 */
export async function httpGet<T = any>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.get(url, config);
    return response.data;
}

/**
 * HTTP POST 요청
 * 
 * @param url 요청 URL (상대 경로)
 * @param data 요청 바디
 * @param config Axios 설정 (선택)
 * @returns 응답 데이터
 * 
 * @example
 * const result = await httpPost<Result>('/users', { name: 'John' });
 */
export async function httpPost<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
    return response.data;
}

/**
 * HTTP PUT 요청
 * 
 * @param url 요청 URL (상대 경로)
 * @param data 요청 바디
 * @param config Axios 설정 (선택)
 * @returns 응답 데이터
 * 
 * @example
 * const updated = await httpPut<User>('/users/123', { name: 'Jane' });
 */
export async function httpPut<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
    return response.data;
}

/**
 * HTTP PATCH 요청
 * 
 * @param url 요청 URL (상대 경로)
 * @param data 요청 바디
 * @param config Axios 설정 (선택)
 * @returns 응답 데이터
 * 
 * @example
 * const patched = await httpPatch<User>('/users/123', { email: 'new@example.com' });
 */
export async function httpPatch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config);
    return response.data;
}

/**
 * HTTP DELETE 요청
 * 
 * @param url 요청 URL (상대 경로)
 * @param config Axios 설정 (선택)
 * @returns 응답 데이터
 * 
 * @example
 * await httpDelete('/users/123');
 */
export async function httpDelete<T = any>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> {
    const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
    return response.data;
}

// ========================================
// Axios 인스턴스 직접 export
// ========================================
/**
 * Axios 인스턴스 직접 사용 (필요 시)
 * 
 * @example
 * import { axiosInstance } from '@/shared/lib/http';
 * const response = await axiosInstance.get('/custom-endpoint');
 */
export { axiosInstance };
