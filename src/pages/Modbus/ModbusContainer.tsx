// src/pages/Modbus/ModbusContainer.tsx

/**
 * ModbusContainer.tsx - 전력 모니터링 드릴다운 시스템
 *
 * 🎯 핵심 기능:
 * - 6단계 줌 레벨: 1시간 → 1일 → 1주일 → 1달 → 6개월 → 1년
 * - 스마트 드릴다운: 주간 보기에서 특정 날짜 클릭 → 해당 일의 시간별 데이터
 * - 실시간 폴링: 현재 시간대에서만 자동 업데이트
 * - 피크 임계값: 컬럼별 설정 가능한 알림선
 * - 통계 계산: 현재 그래프 범위의 평균/최대/최소값
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ModbusPresenter from './ModbusPresenter';
import { fetchModbusQuery } from '@/api/modbus';
import { getErrorMessage } from '@/lib/http';

// 🎯 줌 레벨 타입 정의 (0~5만 허용)
type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5;
type ZoomPreset = '1h' | '1d' | '1w' | '1mo' | '6mo' | '1y';

// 🔧 타입 안전한 줌 설정 매핑 (Record 타입 사용)
const ZOOM_CONFIGS: Record<ZoomLevel, { preset: ZoomPreset; label: string; days: number; realtime: boolean }> = {
    0: { preset: '1h', label: '1시간', days: 1 / 24, realtime: true },
    1: { preset: '1d', label: '1일', days: 1, realtime: true },
    2: { preset: '1w', label: '1주일', days: 7, realtime: false },
    3: { preset: '1mo', label: '1달', days: 30, realtime: false },
    4: { preset: '6mo', label: '6개월', days: 180, realtime: false },
    5: { preset: '1y', label: '1년', days: 365, realtime: false },
};

// 🔧 줌 레벨 유효성 검사 함수
function isValidZoomLevel(level: number): level is ZoomLevel {
    return level >= 0 && level <= 5 && Number.isInteger(level);
}

// 🔧 안전한 줌 설정 조회 함수
function getZoomConfig(level: number) {
    if (!isValidZoomLevel(level)) {
        console.warn(`잘못된 줌 레벨: ${level}, 기본값 2 사용`);
        return ZOOM_CONFIGS[2]; // 기본값: 1주일
    }
    return ZOOM_CONFIGS[level];
}

export default function ModbusContainer() {
    // 🎛️ UI 상태 (타입 안전성 보장)
    const [deviceId, setDeviceId] = useState<number>(11);
    const [column, setColumn] = useState<string>('active_power');
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(2); // 🔧 ZoomLevel 타입 사용
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // 🚨 피크 기준값
    const [peakLimits, setPeakLimits] = useState<Record<string, number>>({
        active_power: 15.0,
        reactive_power: 10.0,
        apparent_power: 20.0,
        voltage_ll: 450,
        voltage_ln: 260,
        current: 80,
        power_factor: 1.0,
        active_energy: 1000,
        reactive_energy: 500,
        apparent_energy: 1200,
    });

    // 📊 데이터 상태
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const timer = useRef<number | undefined>(undefined);
    const deviceOptions = [11, 12, 13, 14, 15];

    // 📝 로그 함수
    const log = useCallback((message: string) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${message}`].slice(-100));
    }, []);

    // 📊 통계 계산 함수
    const calculateStats = useCallback((values: number[]) => {
        const validValues = values.filter((v) => v != null && !isNaN(v));
        if (!validValues.length) return { avg: 0, max: 0, min: 0, count: 0 };

        return {
            avg: validValues.reduce((sum, val) => sum + val, 0) / validValues.length,
            max: Math.max(...validValues),
            min: Math.min(...validValues),
            count: validValues.length,
        };
    }, []);

    // 🔄 데이터 처리 함수
    const processData = useCallback(
        (rawRows: any[]) => {
            const processedRows = rawRows.map((row) => ({
                ...row,
                // ⏰ ISO 문자열을 밀리초로 변환
                bucket: row.bucket ? new Date(row.bucket).getTime() : Date.now(),
                // 🏷️ 사용하기 쉬운 별명 생성
                active_power: row.total_active_power_kw || 0,
                reactive_power: row.total_reactive_power_kvar || 0,
                apparent_power: row.total_apparent_power_kva || 0,
                voltage_ll: row.avg_line_to_line_volts_v || 0,
                voltage_ln: row.avg_line_to_neutral_volts_v || 0,
                current: row.sum_line_currents_a || 0,
                power_factor: row.total_power_factor || 0,
                active_energy: row.total_active_energy_kwh || 0,
                reactive_energy: row.total_reactive_energy_kvarh || 0,
                apparent_energy: row.total_apparent_energy_kvah || 0,
            }));

            // 📊 통계 계산
            const allStats = {
                active_power: calculateStats(processedRows.map((r) => r.active_power)),
                reactive_power: calculateStats(processedRows.map((r) => r.reactive_power)),
                apparent_power: calculateStats(processedRows.map((r) => r.apparent_power)),
                voltage_ll: calculateStats(processedRows.map((r) => r.voltage_ll)),
                voltage_ln: calculateStats(processedRows.map((r) => r.voltage_ln)),
                current: calculateStats(processedRows.map((r) => r.current)),
                power_factor: calculateStats(processedRows.map((r) => r.power_factor)),
                active_energy: calculateStats(processedRows.map((r) => r.active_energy)),
                reactive_energy: calculateStats(processedRows.map((r) => r.reactive_energy)),
                apparent_energy: calculateStats(processedRows.map((r) => r.apparent_energy)),
            };

            setStats(allStats);
            setData(processedRows);
        },
        [calculateStats]
    );

    // 📡 API 호출 함수
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const config = getZoomConfig(zoomLevel); // 🔧 안전한 설정 조회
            let apiParams: any = {
                device_id: deviceId,
                preset: config.preset,
                max_points: Math.min(5000, Math.floor(config.days * 48)),
            };

            // 🗓️ 드릴다운된 특정 날짜 처리
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

            const response = await fetchModbusQuery(apiParams);

            if (response.data && response.data.length > 0) {
                processData(response.data);
                log(`✅ ${config.label} 데이터 ${response.data.length}개 로드됨 (장치 ${deviceId})`);
            } else {
                setData([]);
                setStats({});
                log(`⚠️ ${config.label} 데이터 없음 (장치 ${deviceId})`);
            }

            setError(null);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            log(`❌ 데이터 로드 실패: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [deviceId, zoomLevel, selectedDate, processData, log]);

    // 🔍 줌 인 (확대) - 타입 안전성 보장
    const handleZoomIn = useCallback(() => {
        if (zoomLevel > 0) {
            const newLevel = (zoomLevel - 1) as ZoomLevel; // 🔧 타입 캐스팅
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 확대: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);

    // 🔍 줌 아웃 (축소) - 타입 안전성 보장
    const handleZoomOut = useCallback(() => {
        if (zoomLevel < 5) {
            const newLevel = (zoomLevel + 1) as ZoomLevel; // 🔧 타입 캐스팅
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 축소: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);

    // 🖱️ 차트 클릭 드릴다운
    const handleDataPointClick = useCallback(
        (dataPoint: any, timeMs: number) => {
            const clickedDate = new Date(timeMs);

            if (zoomLevel === 2) {
                // 1주일 → 1일
                setZoomLevel(1);
                setSelectedDate(clickedDate);
                log(`📅 ${clickedDate.toLocaleDateString('ko-KR')} 일별 데이터로 드릴다운`);
            } else if (zoomLevel === 3) {
                // 1달 → 1주일
                setZoomLevel(2);
                const monday = new Date(clickedDate);
                monday.setDate(clickedDate.getDate() - clickedDate.getDay() + 1);
                setSelectedDate(monday);
                log(`📊 ${monday.toLocaleDateString('ko-KR')} 주간 데이터로 드릴다운`);
            } else if (zoomLevel === 1) {
                // 1일 → 1시간
                setZoomLevel(0);
                setSelectedDate(clickedDate);
                log(`🕐 ${clickedDate.toLocaleString('ko-KR')} 시간별 데이터로 드릴다운`);
            }
        },
        [zoomLevel, log]
    );

    // ⏰ useEffect에서도 안전한 설정 조회
    useEffect(() => {
        window.clearInterval(timer.current);

        const config = getZoomConfig(zoomLevel); // 🔧 안전한 설정 조회
        fetchData();

        if (config.realtime) {
            const updateInterval = zoomLevel === 0 ? 10000 : 30000;
            timer.current = window.setInterval(fetchData, updateInterval);
            log(`🔴 실시간 업데이트 시작 (${updateInterval / 1000}초 간격)`);
        } else {
            log(`📊 ${config.label} 정적 모드`);
        }

        return () => window.clearInterval(timer.current);
    }, [zoomLevel, fetchData, log]);

    // 🔄 수동 새로고침
    const handleManualRefresh = useCallback(() => {
        const config = getZoomConfig(zoomLevel);
        log(`🔄 ${config.label} 데이터 수동 새로고침 시작`);
        fetchData();
    }, [fetchData, zoomLevel, log]);

    // 🎯 현재 줌 설정 조회
    const currentZoomConfig = getZoomConfig(zoomLevel);

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            deviceOptions={deviceOptions}
            column={column}
            setColumn={setColumn}
            zoomLevel={zoomLevel}
            zoomLabel={currentZoomConfig.label} // 🔧 안전한 라벨 조회
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            canZoomIn={zoomLevel > 0}
            canZoomOut={zoomLevel < 5}
            onDataPointClick={handleDataPointClick}
            onManualRefresh={handleManualRefresh}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            logs={logs}
            peakLimits={peakLimits}
            setPeakLimits={setPeakLimits}
        />
    );
}
