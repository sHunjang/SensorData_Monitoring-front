/**
 * 폴링 커스텀 훅
 * 
 * 일정 간격으로 데이터를 자동으로 갱신하는 훅
 */

import { useEffect, useRef } from 'react';
import { ENV } from '../config/env';

/**
 * 폴링 훅 옵션
 */
export interface UsePollingOptions {
    /**
     * 폴링 간격 (밀리초)
     * 기본값: ENV.POLLING_INTERVAL (5000ms)
     */
    interval?: number;

    /**
     * 폴링 활성화 여부
     * 기본값: true
     */
    enabled?: boolean;

    /**
     * 즉시 실행 여부
     * 기본값: true (마운트 시 즉시 실행)
     */
    immediate?: boolean;
}

/**
 * 폴링 훅
 * 
 * 일정 간격으로 콜백 함수를 실행합니다.
 * 
 * @param callback 실행할 함수
 * @param options 폴링 옵션
 * 
 * @example
 * usePolling(async () => {
 *   const data = await fetchData();
 *   setData(data);
 * }, { interval: 5000, enabled: true });
 */
export function usePolling(
    callback: () => void | Promise<void>,
    options: UsePollingOptions = {}
): void {
    const {
        interval = ENV.POLLING_INTERVAL,
        enabled = true,
        immediate = true,
    } = options;

    const callbackRef = useRef(callback);

    // 콜백 함수 업데이트
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // 즉시 실행
        if (immediate) {
            callbackRef.current();
        }

        // 폴링 시작
        const timer = setInterval(() => {
            callbackRef.current();
        }, interval);

        // 클린업
        return () => {
            clearInterval(timer);
        };
    }, [interval, enabled, immediate]);
}
