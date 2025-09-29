// src/pages/Env/EnvContainer.tsx

/**
 * EnvContainer - 환경센서 모니터링 데이터 관리 컨테이너
 *
 * 주요 기능:
 * 1. 실시간/범위 모드로 온습도 환경 데이터 조회
 * 2. 백엔드 env_router.py와 완벽 연동
 * 3. 데이터 정규화 및 통계 계산 (온도, 습도, 쾌적도)
 * 4. 백그라운드 자동 갱신 (실시간 모드)
 * 5. 에러 처리 및 로그 관리
 * 6. 드릴다운 차트 지원 (온도+습도 동시 표시)
 *
 * 데이터 흐름:
 * 백엔드 API → fetchEnvQuery() → normalizeRows() → 통계 계산 → UI 전달
 *
 * 측정 데이터:
 * - temperature: 온도 (°C)
 * - humidity: 습도 (%)
 * - 기타 환경 파라미터
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
import { getErrorMessage } from '@/lib/http';
import { normalizeRows } from '@/lib/time';

// 시간 범위 타입 정의 (백엔드 API 호환)
type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

/**
 * 환경센서 통계 정보 타입 정의 (TypeScript 안전성)
 * - useState의 setStats 콜백에서 사용할 타입
 * - 온습도 센서 특화 데이터 구조
 */
interface EnvStatsData {
    [key: string]: {
        avg: number | null;
        max: number | null;
        min: number | null;
        count: number;
        sum?: number;
    };
}

export default function EnvContainer() {
    // ============= 상태 관리 (타입 안전성) =============

    // 시간 범위 설정 (환경센서는 1일 기본 - 변화가 상대적으로 느림)
    const [preset, setPreset] = useState<Preset>('1d');

    // 모니터링 모드: 실시간 vs 과거 데이터 조회
    const [mode, setMode] = useState<'realtime' | 'range'>('realtime');

    // 선택된 장치 ID (환경 센서 식별자)
    const [deviceId, setDeviceId] = useState<number>(21); // 기본 환경센서 장치

    // 차트에 표시될 데이터 배열 (시간순 정렬됨)
    const [data, setData] = useState<any[]>([]);

    // 통계 정보 (평균, 최대, 최소, 개수) - 타입 안전성
    const [stats, setStats] = useState<EnvStatsData>({});

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
     * 환경 데이터 통계 계산
     * - 온도(temperature)와 습도(humidity) 값들의 평균/최대/최소/개수 계산
     * - 유효한 숫자 값만 필터링해서 계산
     * - 백엔드에서 계산된 통계가 있으면 우선 사용
     */
    const recompute = (rows: any[]) => {
        // 🔄 백엔드 응답에 stats가 포함되어 있으면 우선 사용
        if (rows.length > 0 && rows[0]._stats) {
            setStats(rows[0]._stats as EnvStatsData);
            log('백엔드 환경센서 통계 데이터 사용');
            return;
        }

        // 📊 프론트엔드에서 직접 계산 (백엔드 env_router.py와 동일한 로직)
        // 온도 데이터 추출 및 필터링 (백엔드 필드명과 정확히 일치)
        const temperature = rows
            .map((r) => r.temperature) // 백엔드 env_router.py 필드명
            .filter((v): v is number => v != null && Number.isFinite(v));

        // 습도 데이터 추출 및 필터링
        const humidity = rows
            .map((r) => r.humidity) // 백엔드 env_router.py 필드명
            .filter((v): v is number => v != null && Number.isFinite(v));

        /**
         * 통계 계산 헬퍼 함수
         * @param arr 숫자 배열
         * @returns 평균, 최대, 최소, 개수, 합계
         */
        const calc = (arr: number[]) =>
            arr.length
                ? {
                      avg: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2),
                      max: Math.max(...arr),
                      min: Math.min(...arr),
                      count: arr.length,
                      sum: arr.reduce((a, b) => a + b, 0),
                  }
                : { avg: null, max: null, min: null, count: 0, sum: 0 };

        // 통계 상태 업데이트
        const newStats: EnvStatsData = {
            temperature: calc(temperature),
            humidity: calc(humidity),
        };

        setStats(newStats);
        log(`환경 통계 계산 완료: 온도 ${temperature.length}개, 습도 ${humidity.length}개 데이터포인트`);
    };

    // ============= 데이터 조회 함수 =============

    /**
     * 실시간 환경 데이터 조회
     * - 최신 15분간의 데이터를 300개까지 가져옴
     * - 기존 데이터에 새 데이터를 병합 (중복 제거)
     * - 백엔드 env_router.py의 /data/env/query 엔드포인트 호출
     */
    const pullOnce = useCallback(async () => {
        try {
            // 백엔드 API 호출 (15분 범위, 최대 300포인트)
            const res = await fetchEnvQuery({
                device_id: deviceId, // 백엔드와 정확히 일치하는 필드명
                preset: '15m', // 실시간은 최근 15분
                max_points: 300, // 성능 최적화
            });

            // ✅ 백엔드 응답이 이미 정규화되어 있으므로 직접 사용
            const rows = res.data ?? [];

            if (rows.length) {
                setData((prev) => {
                    // 기존 데이터(700개) + 새 데이터 = 최대 1000개 유지
                    const next = [...prev.slice(-700), ...rows].slice(-1000);
                    recompute(next);
                    return next;
                });

                // 성공 로그 (백엔드 필드명 사용)
                const lastRow = rows.at(-1);
                log(
                    `실시간 조회 성공 device=${deviceId} ` +
                        `온도=${lastRow?.temperature || 'N/A'}°C ` +
                        `습도=${lastRow?.humidity || 'N/A'}%`
                );

                // 🔄 백엔드에서 계산된 통계도 함께 사용
                if (res.stats) {
                    setStats((prevStats: EnvStatsData) => ({
                        ...prevStats,
                        ...(res.stats as EnvStatsData),
                    }));
                    log('백엔드 환경센서 통계 정보 병합 완료');
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

            // 네트워크 에러 시 재시도 로직 (옵션)
            if (msg.includes('NetworkError') || msg.includes('fetch')) {
                log('환경센서 네트워크 에러 감지');
            }
        }
    }, [deviceId]); // deviceId 변경시에만 함수 재생성

    /**
     * 범위 환경 데이터 조회 (과거 데이터)
     * - 사용자가 선택한 기간(preset)의 데이터 조회
     * - 환경 트렌드 분석 및 패턴 파악용
     */
    const queryRange = useCallback(async () => {
        try {
            const res = await fetchEnvQuery({
                device_id: deviceId,
                preset,
                max_points: 2000,
            });

            const rows = res.data ?? [];

            // 전체 데이터 교체 (실시간과 달리 병합하지 않음)
            setData(rows);
            recompute(rows);

            log(`범위 조회 성공 device=${deviceId} 기간=${preset} 개수=${rows.length}`);

            // 백엔드 통계 정보 활용
            if (res.stats) {
                setStats((prevStats: EnvStatsData) => ({
                    ...prevStats,
                    ...(res.stats as EnvStatsData),
                }));
                log('범위 조회 - 백엔드 환경센서 통계 정보 적용');
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
     * - 실시간 모드일 때만 3초마다 자동 갱신
     * - 환경 데이터는 변화가 느려서 3초 간격이 적합
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

            // 3초마다 자동 갱신 (환경 데이터는 조금 느려도 됨)
            timer.current = window.setInterval(() => {
                pullOnce();
            }, 3000);

            log('환경센서 실시간 모드 시작 - 3초 간격 자동 갱신');
        } else {
            log('환경센서 실시간 모드 중지');
        }

        // 컴포넌트 정리시 타이머 해제
        return () => {
            if (timer.current) {
                window.clearInterval(timer.current);
                timer.current = undefined;
                log('환경센서 타이머 정리 완료');
            }
        };
    }, [mode, pullOnce]);

    // 컴포넌트 초기화 로그
    useEffect(() => {
        log(`EnvContainer 초기화 - 환경센서 장치 ID: ${deviceId}`);

        return () => {
            log('EnvContainer 정리 중...');
        };
    }, [deviceId]);

    // ============= UI 렌더링 =============

    return (
        <EnvPresenter
            // 장치 관리
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={[21, 22, 23]} // 사용 가능한 환경센서 목록
            // 시간 범위 및 모드 설정
            preset={preset}
            setPreset={setPreset}
            mode={mode}
            setMode={setMode}
            // 수동 새로고침 함수
            onQuery={mode === 'realtime' ? pullOnce : queryRange}
            // 차트 및 UI에 전달할 데이터
            data={data} // 시계열 온습도 데이터 배열
            stats={stats} // 통계 정보 (평균/최대/최소 온습도)
            error={error} // 에러 메시지 (있을 경우)
            logs={logs} // 시스템 활동 로그
        />
    );
}
