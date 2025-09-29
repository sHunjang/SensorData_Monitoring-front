// src/pages/Solar/SolarContainer.tsx

/**
 * SolarContainer - 일사량 모니터링 데이터 관리 컨테이너
 *
 * 주요 기능:
 * 1. 실시간/범위 모드로 태양광 일사량 데이터 조회
 * 2. 백엔드 solar_router.py와 완벽 연동
 * 3. 데이터 정규화 및 통계 계산 (일사량, 효율성)
 * 4. 백그라운드 자동 갱신 (실시간 모드)
 * 5. 에러 처리 및 로그 관리
 * 6. 드릴다운 차트 지원
 *
 * 데이터 흐름:
 * 백엔드 API → fetchSolarQuery() → normalizeRows() → 통계 계산 → UI 전달
 *
 * 측정 항목:
 * - irradiance: 일사량 (W/m²)
 * - solar: 레거시 일사량 필드
 * - device_id: 태양광 센서 장치 ID
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

// 시간 범위 타입 정의 (백엔드 API 호환)
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

/**
 * 일사량 통계 정보 타입 정의 (TypeScript 안전성)
 * - useState의 setStats 콜백에서 사용할 타입
 * - 태양광 센서 특화 데이터 구조
 */
interface SolarStatsData {
    [key: string]: {
        avg: number | null;
        max: number | null;
        min: number | null;
        count: number;
        sum?: number;
    };
}

export default function SolarContainer() {
    // ============= 상태 관리 (타입 안전성) =============

    // 선택된 장치 ID (태양광 센서 식별자)
    const [deviceId, setDeviceId] = useState<number>(31); // 기본 태양광 장치

    // 시간 범위 설정 (기본값: 15분)
    const [preset, setPreset] = useState<Preset>('15m');

    // 모니터링 모드: 실시간 vs 과거 데이터 조회
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    // 차트에 표시될 데이터 배열 (시간순 정렬됨)
    const [data, setData] = useState<any[]>([]);

    // 통계 정보 (평균, 최대, 최소, 개수) - 타입 안전성
    const [stats, setStats] = useState<SolarStatsData>({});

    // 에러 메시지 (API 호출 실패시)
    const [error, setError] = useState<string | null>(null);

    // 시스템 활동 로그 (최대 300개 유지)
    const [logs, setLogs] = useState<string[]>([]);

    // 실시간 모드용 타이머 참조
    const timer = useRef<number | undefined>(undefined);

    // ============= 유틸리티 함수 =============

    /**
     * 로그 메시지 추가
     * - 시간 스탬프와 함께 로그 기록
     * - 최대 300개까지만 유지 (메모리 절약)
     */
    const log = (message: string) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString('ko-KR')}] ${message}`].slice(-300));
    };

    /**
     * 태양광 데이터 통계 계산
     * - 일사량(irradiance) 값들의 평균/최대/최소/개수 계산
     * - 유효한 숫자 값만 필터링해서 계산
     * - 백엔드에서 계산된 통계가 있으면 우선 사용
     */
    const recompute = (rows: any[]) => {
        // 🔄 백엔드 응답에 stats가 포함되어 있으면 우선 사용
        if (rows.length > 0 && rows[0]._stats) {
            setStats(rows[0]._stats as SolarStatsData);
            log('백엔드 태양광 통계 데이터 사용');
            return;
        }

        // 📊 프론트엔드에서 직접 계산 (백엔드 solar_router.py와 동일한 로직)
        // 일사량 데이터 추출 및 필터링 (여러 필드명 지원)
        const irradiance = rows
            .map((r) => r.irradiance_w_per_m2 || r.irradiance || r.solar || r.value)
            .filter((v): v is number => v != null && Number.isFinite(v));

        /**
         * 통계 계산 헬퍼 함수
         * @param arr 숫자 배열
         * @returns 평균, 최대, 최소, 개수, 합계
         */
        const calc = (arr: number[]) =>
            arr.length
                ? {
                      avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(3),
                      max: Math.max(...arr),
                      min: Math.min(...arr),
                      count: arr.length,
                      sum: arr.reduce((a, b) => a + b, 0),
                  }
                : { avg: null, max: null, min: null, count: 0, sum: 0 };

        // 통계 상태 업데이트
        const newStats: SolarStatsData = {
            irradiance: calc(irradiance),
            solar: calc(irradiance), // 레거시 호환성
        };

        setStats(newStats);
        log(`일사량 통계 계산 완료: ${irradiance.length}개 데이터포인트, 평균 ${newStats.irradiance.avg}W/m²`);
    };

    // ============= 데이터 조회 함수 =============

    /**
     * 실시간 일사량 데이터 조회
     * - 최신 15분간의 데이터를 300개까지 가져옴
     * - 기존 데이터에 새 데이터를 병합 (중복 제거)
     * - 백엔드 solar_router.py의 /data/solar/query 엔드포인트 호출
     */
    const pullOnce = useCallback(async () => {
        try {
            // 백엔드 API 호출 (15분 범위, 최대 300포인트)
            const res = await fetchSolarQuery({
                device_id: deviceId,
                preset: '15m',
                max_points: 300,
            });

            // 서버 데이터를 차트 호환 형식으로 변환
            const rows = normalizeRows(res.data ?? []);

            if (rows.length) {
                setData((prev) => {
                    // 기존 데이터(700개) + 새 데이터 = 최대 1000개 유지
                    const next = [...prev.slice(-700), ...rows].slice(-1000);
                    recompute(next);
                    return next;
                });

                // 성공 로그 (마지막 일사량 값 표시)
                const lastRow = rows.at(-1);
                const lastIrradiance = lastRow?.irradiance_w_per_m2 || lastRow?.solar || 'N/A';
                log(`실시간 조회 성공 device=${deviceId} ` + `일사량=${lastIrradiance}W/m²`);

                // 🔄 백엔드에서 계산된 통계도 함께 사용
                if (res.stats) {
                    setStats((prevStats: SolarStatsData) => ({
                        ...prevStats,
                        ...(res.stats as SolarStatsData),
                    }));
                    log('백엔드 일사량 통계 정보 병합 완료');
                }
            } else {
                setData([]);
                setStats({});
                log(`실시간 조회 - 데이터 없음 device=${deviceId}`);
            }

            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            log(`실시간 조회 실패: ${msg}`);

            // 네트워크 에러시 재시도 알림
            if (msg.includes('NetworkError') || msg.includes('fetch')) {
                log('태양광 센서 네트워크 에러 감지');
            }
        }
    }, [deviceId]);

    /**
     * 범위 일사량 데이터 조회 (과거 데이터)
     * - 사용자가 선택한 기간(preset)의 데이터 조회
     * - 태양광 효율성 분석 및 일변화 패턴 파악용
     */
    const queryRange = useCallback(async () => {
        try {
            const res = await fetchSolarQuery({
                device_id: deviceId,
                preset,
                max_points: 2000,
            });

            const rows = normalizeRows(res.data ?? []);
            setData(rows);
            recompute(rows);

            log(`범위 조회 성공 device=${deviceId} 기간=${preset} 개수=${rows.length}`);

            // 백엔드 통계 정보 활용
            if (res.stats) {
                setStats((prevStats: SolarStatsData) => ({
                    ...prevStats,
                    ...(res.stats as SolarStatsData),
                }));
                log('범위 조회 - 백엔드 일사량 통계 정보 적용');
            }

            setError(null);
        } catch (e) {
            const msg = getErrorMessage(e);
            setError(msg);
            setData([]);
            setStats({});
            log(`범위 조회 실패: ${msg}`);
        }
    }, [preset, deviceId]);

    // ============= 생명주기 관리 =============

    /**
     * 실시간 모드 폴링 관리
     * - 실시간 모드일 때만 2초마다 자동 갱신
     * - 태양광 데이터는 전력보다 변화가 느려서 2초가 적합
     */
    useEffect(() => {
        // 기존 타이머 정리
        if (timer.current) {
            window.clearInterval(timer.current);
            timer.current = undefined;
        }

        if (mode === 'realtime') {
            // 즉시 한 번 조회
            pullOnce();

            // 2초마다 자동 갱신
            timer.current = window.setInterval(() => {
                pullOnce();
            }, 2000);

            log('태양광 실시간 모드 시작 - 2초 간격 자동 갱신');
        } else {
            log('태양광 실시간 모드 중지');
        }

        // 컴포넌트 정리시 타이머 해제
        return () => {
            if (timer.current) {
                window.clearInterval(timer.current);
                timer.current = undefined;
                log('태양광 타이머 정리 완료');
            }
        };
    }, [mode, pullOnce]);

    // 컴포넌트 초기화 로그
    useEffect(() => {
        log(`SolarContainer 초기화 - 태양광 장치 ID: ${deviceId}`);

        return () => {
            log('SolarContainer 정리 중...');
        };
    }, [deviceId]);

    // ============= UI 렌더링 =============

    return (
        <SolarPresenter
            // 장치 관리
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={[31, 32, 33]} // 사용 가능한 태양광 장치 목록
            // 시간 범위 및 모드 설정
            preset={preset}
            setPreset={setPreset}
            mode={mode}
            setMode={setMode}
            // 수동 새로고침 함수
            onQuery={mode === 'realtime' ? pullOnce : queryRange}
            // 차트 및 UI에 전달할 데이터
            data={data} // 시계열 일사량 데이터 배열
            stats={stats} // 통계 정보 (평균/최대/최소 일사량)
            error={error} // 에러 메시지 (있을 경우)
            logs={logs} // 시스템 활동 로그
        />
    );
}
