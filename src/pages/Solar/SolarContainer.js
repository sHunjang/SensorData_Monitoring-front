import { jsx as _jsx } from "react/jsx-runtime";
// src/pages/Solar/SolarContainer.tsx
/**
 * SolarContainer.tsx - 태양광센서 모니터링 드릴다운 시스템
 *
 * 🎯 핵심 기능:
 * - 6단계 줌 레벨: 1시간 → 1일 → 1주일 → 1달 → 6개월 → 1년
 * - 스마트 드릴다운: 주간 보기에서 특정 날짜 클릭 → 해당 일의 시간별 데이터
 * - 실시간 폴링: 현재 시간대에서만 자동 업데이트 (태양광센서 특성 반영)
 * - 일사량 임계값: 태양광 발전 최적화를 위한 알림선
 * - 통계 계산: 현재 그래프 범위의 평균/최대/최소값
 * - 타입 안전성: 완전한 TypeScript 지원
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery } from '@/api/solar';
import { getErrorMessage } from '@/lib/http';
// 🔧 타입 안전한 줌 설정 매핑 (태양광센서 특성 반영)
const ZOOM_CONFIGS = {
    0: { preset: '1h', label: '1시간', days: 1 / 24, realtime: true }, // 실시간 일사량 변화 추적
    1: { preset: '1d', label: '1일', days: 1, realtime: true }, // 일일 태양광 패턴 추적
    2: { preset: '1w', label: '1주일', days: 7, realtime: false }, // 주간 날씨 패턴 분석 (기본값)
    3: { preset: '1mo', label: '1달', days: 30, realtime: false }, // 월별 일사량 변화
    4: { preset: '6mo', label: '6개월', days: 180, realtime: false }, // 계절별 일사량 변화
    5: { preset: '1y', label: '1년', days: 365, realtime: false }, // 연간 일사량 패턴
};
// 🔧 줌 레벨 유효성 검사 함수
function isValidZoomLevel(level) {
    return level >= 0 && level <= 5 && Number.isInteger(level);
}
// 🔧 안전한 줌 설정 조회 함수
function getZoomConfig(level) {
    if (!isValidZoomLevel(level)) {
        console.warn(`잘못된 태양광 줌 레벨: ${level}, 기본값 2 사용`);
        return ZOOM_CONFIGS[2]; // 기본값: 1주일
    }
    return ZOOM_CONFIGS[level];
}
export default function SolarContainer() {
    // 🎛️ UI 상태 (타입 안전성 보장)
    const [deviceId, setDeviceId] = useState(31);
    const [column, setColumn] = useState('solar'); // 태양광센서는 일사량 하나만
    const [zoomLevel, setZoomLevel] = useState(2); // 기본값: 1주일 보기
    const [selectedDate, setSelectedDate] = useState(null); // 드릴다운된 특정 날짜
    // 🚨 태양광 임계값 (일사량 기준)
    const [peakLimits, setPeakLimits] = useState({
        solar: 1000.0, // 일사량 1000 W/m² (강한 일사량 기준)
    });
    // 📊 데이터 상태
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    // ⏰ 실시간 업데이트용 타이머
    const timer = useRef(undefined);
    const deviceOptions = [31, 32, 33, 34, 35]; // 태양광센서 장치들
    /**
     * 📝 로그 기록 함수 (태양광센서 전용 메시지)
     */
    const log = useCallback((message) => {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        setLogs((prev) => [...prev, `${timestamp}: ${message}`].slice(-100));
    }, []);
    /**
     * 📊 통계 계산 헬퍼 함수 (일사량 특성 반영)
     */
    const calculateStats = useCallback((values) => {
        const validValues = values.filter((v) => v != null && !isNaN(v));
        if (!validValues.length)
            return { avg: 0, max: 0, min: 0, count: 0 };
        return {
            avg: validValues.reduce((sum, val) => sum + val, 0) / validValues.length,
            max: Math.max(...validValues),
            min: Math.min(...validValues),
            count: validValues.length,
        };
    }, []);
    /**
     * 🔄 데이터 재계산 및 태양광 데이터 처리
     * 백엔드에서 받은 원본 컬럼명을 사용하기 쉬운 별명으로 매핑
     */
    const processData = useCallback((rawRows) => {
        // 🏷️ 태양광센서 데이터 별명 매핑
        const processedRows = rawRows.map((row) => ({
            ...row, // 원본 데이터 유지
            // ⏰ 시간 필드를 밀리초로 변환 (차트 X축용)
            bucket: row.bucket ? new Date(row.bucket).getTime() : Date.now(),
            // ☀️ 태양광센서 별명 (일사량)
            solar: row.solar || 0,
        }));
        // 📊 일사량 통계 자동 계산
        const allStats = {
            solar: calculateStats(processedRows.map((r) => r.solar)),
        };
        // 🔄 상태 업데이트
        setStats(allStats);
        setData(processedRows);
    }, [calculateStats]);
    /**
     * 📡 API 호출 함수 (줌 레벨과 선택된 날짜 기반)
     */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const config = getZoomConfig(zoomLevel); // 🔧 안전한 설정 조회
            let apiParams = {
                device_id: deviceId,
                preset: config.preset,
                max_points: Math.min(5000, Math.floor(config.days * 48)), // 태양광센서 특성에 맞는 포인트 수
            };
            // 🗓️ 특정 날짜가 선택된 경우 (드릴다운)
            if (selectedDate && zoomLevel <= 1) {
                const dayStart = new Date(selectedDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(selectedDate);
                dayEnd.setHours(23, 59, 59, 999);
                apiParams = {
                    ...apiParams,
                    start: dayStart.toISOString(),
                    end: dayEnd.toISOString(),
                };
            }
            // 📡 Solar API 호출
            const response = await fetchSolarQuery(apiParams);
            if (response.data && response.data.length > 0) {
                processData(response.data);
                log(`✅ ${config.label} 태양광 데이터 ${response.data.length}개 로드됨 (센서 ${deviceId})`);
            }
            else {
                setData([]);
                setStats({});
                log(`⚠️ ${config.label} 태양광 데이터 없음 (센서 ${deviceId})`);
            }
            setError(null);
        }
        catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            log(`❌ 태양광 데이터 로드 실패: ${errorMessage}`);
        }
        finally {
            setLoading(false);
        }
    }, [deviceId, zoomLevel, selectedDate, processData, log]);
    /**
     * 🔍 줌 인 (확대) - 타입 안전성 보장
     */
    const handleZoomIn = useCallback(() => {
        if (zoomLevel > 0) {
            const newLevel = (zoomLevel - 1); // 🔧 타입 캐스팅
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 태양광 확대: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);
    /**
     * 🔍 줌 아웃 (축소) - 타입 안전성 보장
     */
    const handleZoomOut = useCallback(() => {
        if (zoomLevel < 5) {
            const newLevel = (zoomLevel + 1); // 🔧 타입 캐스팅
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 태양광 축소: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);
    /**
     * 🖱️ 차트 클릭 드릴다운 (태양광센서 특성 반영)
     */
    const handleDataPointClick = useCallback((dataPoint, timeMs) => {
        const clickedDate = new Date(timeMs);
        if (zoomLevel === 2) {
            // 1주일 → 1일 (일별 태양광 패턴 분석)
            setZoomLevel(1);
            setSelectedDate(clickedDate);
            log(`📅 ${clickedDate.toLocaleDateString('ko-KR')} 태양광 일별 패턴으로 드릴다운`);
        }
        else if (zoomLevel === 3) {
            // 1달 → 1주일 (주별 날씨 패턴 분석)
            setZoomLevel(2);
            const monday = new Date(clickedDate);
            monday.setDate(clickedDate.getDate() - clickedDate.getDay() + 1);
            setSelectedDate(monday);
            log(`📊 ${monday.toLocaleDateString('ko-KR')} 태양광 주간 패턴으로 드릴다운`);
        }
        else if (zoomLevel === 1) {
            // 1일 → 1시간 (시간별 일사량 변화)
            setZoomLevel(0);
            setSelectedDate(clickedDate);
            log(`🕐 ${clickedDate.toLocaleString('ko-KR')} 태양광 시간별 변화로 드릴다운`);
        }
        // 더 높은 레벨에서는 드릴다운하지 않음 (연간/반년 데이터는 개요용)
    }, [zoomLevel, log]);
    /**
     * ⏰ 실시간 폴링 및 데이터 로드 관리 (태양광센서 특성 반영)
     */
    useEffect(() => {
        window.clearInterval(timer.current);
        const config = getZoomConfig(zoomLevel); // 🔧 안전한 설정 조회
        // 초기 데이터 로드
        fetchData();
        // 실시간 업데이트 설정 (태양광센서는 낮에만 의미 있음)
        if (config.realtime) {
            // 태양광센서는 업데이트 주기가 더 길어도 됨 (일사량 변화가 전력보다 느림)
            const updateInterval = zoomLevel === 0 ? 15000 : 45000; // 1시간=15초, 1일=45초
            timer.current = window.setInterval(fetchData, updateInterval);
            log(`🔴 태양광센서 실시간 업데이트 시작 (${updateInterval / 1000}초 간격)`);
        }
        else {
            log(`📊 ${config.label} 정적 모드 (태양광 분석용)`);
        }
        // 컴포넌트 언마운트 시 타이머 정리
        return () => window.clearInterval(timer.current);
    }, [zoomLevel, fetchData, log]);
    /**
     * 🔄 수동 새로고침 (태양광센서 전용 메시지)
     */
    const handleManualRefresh = useCallback(() => {
        const config = getZoomConfig(zoomLevel);
        log(`🔄 ${config.label} 태양광 데이터 수동 새로고침 시작`);
        fetchData();
    }, [fetchData, zoomLevel, log]);
    // 🎯 현재 줌 설정 조회
    const currentZoomConfig = getZoomConfig(zoomLevel);
    // 📊 Presenter에 전달할 props 구성 (SolarPresenter와 완전 호환)
    return (_jsx(SolarPresenter
    // 장치 및 컬럼 선택
    , { 
        // 장치 및 컬럼 선택
        deviceId: deviceId, setDeviceId: setDeviceId, deviceOptions: deviceOptions, column: column, setColumn: setColumn, 
        // 줌 컨트롤
        zoomLevel: zoomLevel, zoomLabel: currentZoomConfig.label, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, canZoomIn: zoomLevel > 0, canZoomOut: zoomLevel < 5, 
        // 차트 인터랙션
        onDataPointClick: handleDataPointClick, onManualRefresh: handleManualRefresh, 
        // 데이터와 상태
        data: data, stats: stats, loading: loading, error: error, logs: logs, 
        // 태양광 임계값
        peakLimits: peakLimits, setPeakLimits: setPeakLimits }));
}
