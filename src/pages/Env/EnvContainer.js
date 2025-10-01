import { jsx as _jsx } from "react/jsx-runtime";
// src/pages/Env/EnvContainer.tsx - 타입 안전 버전
import { useCallback, useEffect, useRef, useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery } from '@/api/env';
import { getErrorMessage } from '@/lib/http';
const ZOOM_CONFIGS = {
    0: { preset: '1h', label: '1시간', days: 1 / 24, realtime: true },
    1: { preset: '1d', label: '1일', days: 1, realtime: true },
    2: { preset: '1w', label: '1주일', days: 7, realtime: false },
    3: { preset: '1mo', label: '1달', days: 30, realtime: false },
    4: { preset: '6mo', label: '6개월', days: 180, realtime: false },
    5: { preset: '1y', label: '1년', days: 365, realtime: false },
};
function isValidZoomLevel(level) {
    return level >= 0 && level <= 5 && Number.isInteger(level);
}
function getZoomConfig(level) {
    if (!isValidZoomLevel(level)) {
        console.warn(`잘못된 줌 레벨: ${level}, 기본값 2 사용`);
        return ZOOM_CONFIGS[2];
    }
    return ZOOM_CONFIGS[level];
}
export default function EnvContainer() {
    const [deviceId, setDeviceId] = useState(21);
    const [column, setColumn] = useState('temperature');
    const [zoomLevel, setZoomLevel] = useState(2);
    const [selectedDate, setSelectedDate] = useState(null);
    const [peakLimits, setPeakLimits] = useState({
        temperature: 30.0,
        humidity: 80.0,
    });
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const timer = useRef(undefined);
    const deviceOptions = [21, 22, 23];
    const log = useCallback((message) => {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString('ko-KR')}: ${message}`].slice(-100));
    }, []);
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
    const processData = useCallback((rawRows) => {
        const processedRows = rawRows.map((row) => ({
            ...row,
            bucket: row.bucket ? new Date(row.bucket).getTime() : Date.now(),
            temperature: row.temperature || 0,
            humidity: row.humidity || 0,
        }));
        const allStats = {
            temperature: calculateStats(processedRows.map((r) => r.temperature)),
            humidity: calculateStats(processedRows.map((r) => r.humidity)),
        };
        setStats(allStats);
        setData(processedRows);
    }, [calculateStats]);
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const config = getZoomConfig(zoomLevel);
            let apiParams = {
                device_id: deviceId,
                preset: config.preset,
                max_points: Math.min(5000, Math.floor(config.days * 48)),
            };
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
            const response = await fetchEnvQuery(apiParams);
            if (response.data && response.data.length > 0) {
                processData(response.data);
                log(`✅ ${config.label} 환경 데이터 ${response.data.length}개 로드됨 (장치 ${deviceId})`);
            }
            else {
                setData([]);
                setStats({});
                log(`⚠️ ${config.label} 환경 데이터 없음 (장치 ${deviceId})`);
            }
            setError(null);
        }
        catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            log(`❌ 환경 데이터 로드 실패: ${errorMessage}`);
        }
        finally {
            setLoading(false);
        }
    }, [deviceId, zoomLevel, selectedDate, processData, log]);
    const handleZoomIn = useCallback(() => {
        if (zoomLevel > 0) {
            const newLevel = (zoomLevel - 1);
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 확대: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);
    const handleZoomOut = useCallback(() => {
        if (zoomLevel < 5) {
            const newLevel = (zoomLevel + 1);
            setZoomLevel(newLevel);
            setSelectedDate(null);
            const config = getZoomConfig(newLevel);
            log(`🔍 축소: ${config.label} 범위로 전환`);
        }
    }, [zoomLevel, log]);
    const handleDataPointClick = useCallback((dataPoint, timeMs) => {
        const clickedDate = new Date(timeMs);
        if (zoomLevel === 2) {
            setZoomLevel(1);
            setSelectedDate(clickedDate);
            log(`📅 ${clickedDate.toLocaleDateString('ko-KR')} 환경 일별 데이터로 드릴다운`);
        }
        else if (zoomLevel === 3) {
            setZoomLevel(2);
            const monday = new Date(clickedDate);
            monday.setDate(clickedDate.getDate() - clickedDate.getDay() + 1);
            setSelectedDate(monday);
            log(`📊 ${monday.toLocaleDateString('ko-KR')} 환경 주간 데이터로 드릴다운`);
        }
        else if (zoomLevel === 1) {
            setZoomLevel(0);
            setSelectedDate(clickedDate);
            log(`🕐 ${clickedDate.toLocaleString('ko-KR')} 환경 시간별 데이터로 드릴다운`);
        }
    }, [zoomLevel, log]);
    useEffect(() => {
        window.clearInterval(timer.current);
        const config = getZoomConfig(zoomLevel);
        fetchData();
        if (config.realtime) {
            const updateInterval = zoomLevel === 0 ? 15000 : 30000;
            timer.current = window.setInterval(fetchData, updateInterval);
            log(`🔴 환경센서 실시간 업데이트 시작 (${updateInterval / 1000}초 간격)`);
        }
        else {
            log(`📊 ${config.label} 정적 모드`);
        }
        return () => window.clearInterval(timer.current);
    }, [zoomLevel, fetchData, log]);
    const handleManualRefresh = useCallback(() => {
        const config = getZoomConfig(zoomLevel);
        log(`🔄 ${config.label} 환경 데이터 수동 새로고침 시작`);
        fetchData();
    }, [fetchData, zoomLevel, log]);
    const currentZoomConfig = getZoomConfig(zoomLevel);
    return (_jsx(EnvPresenter, { deviceId: deviceId, setDeviceId: setDeviceId, deviceOptions: deviceOptions, column: column, setColumn: setColumn, zoomLevel: zoomLevel, zoomLabel: currentZoomConfig.label, onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, canZoomIn: zoomLevel > 0, canZoomOut: zoomLevel < 5, onDataPointClick: handleDataPointClick, onManualRefresh: handleManualRefresh, data: data, stats: stats, loading: loading, error: error, logs: logs, peakLimits: peakLimits, setPeakLimits: setPeakLimits }));
}
