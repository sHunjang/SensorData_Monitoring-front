/**
 * ModbusContainer.tsx
 *
 * Modbus 전력량계 데이터 관리 Container
 * - 디바이스 선택, 집계 단위(preset) 관리
 * - 실시간 폴링
 * - Container-Presenter 패턴
 */

import React, { useState, useEffect } from 'react';
import { ModbusPresenter } from './ModbusPresenter';
import { fetchModbusData, ModbusResponse } from '@/api/modbus';

export const ModbusContainer: React.FC = () => {
    // ----- 상태 관리 -----

    /** 선택된 디바이스 ID */
    const [selectedDeviceId, setSelectedDeviceId] = useState<number>(11);

    /** 집계 단위 (1m=1분, 15m=15분) */
    const [preset, setPreset] = useState<'1m' | '15m'>('1m');

    /** API 응답 데이터 */
    const [data, setData] = useState<ModbusResponse | null>(null);

    /** 실시간 최신 데이터 (배열의 마지막 요소) */
    const [realtimeData, setRealtimeData] = useState<any>(null);

    /** 로딩 상태 */
    const [loading, setLoading] = useState<boolean>(false);

    /** 에러 메시지 */
    const [error, setError] = useState<string | null>(null);

    // ----- 데이터 로드 함수 -----

    /**
     * 데이터 로드
     * - fetchModbusData API 호출
     * - 성공 시 data와 realtimeData 업데이트
     */
    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // ✅ 신규 API 호출
            const response = await fetchModbusData({
                deviceid: selectedDeviceId,
                preset,
                maxpoints: preset === '1m' ? 120 : 60, // 1분: 120포인트, 15분: 60포인트
            });

            setData(response);

            // 실시간 데이터: 배열의 마지막 요소
            if (response.data && response.data.length > 0) {
                setRealtimeData(response.data[response.data.length - 1]);
            }
        } catch (err: any) {
            console.error('Failed to load modbus data:', err);
            setError(err.message || 'Failed to load data');
            setData(null);
            setRealtimeData(null);
        } finally {
            setLoading(false);
        }
    };

    // ----- 실시간 폴링 Effect -----

    /**
     * 디바이스/Preset 변경 시 데이터 로드
     * - 15초마다 자동 새로고침
     */
    useEffect(() => {
        loadData();

        // 15초마다 폴링
        const interval = setInterval(loadData, 15000);

        // Cleanup
        return () => clearInterval(interval);
    }, [selectedDeviceId, preset]);

    // ----- 이벤트 핸들러 -----

    /** 디바이스 변경 */
    const handleDeviceChange = (deviceId: number) => {
        setSelectedDeviceId(deviceId);
    };

    /** Preset 변경 */
    const handlePresetChange = (newPreset: '1m' | '15m') => {
        setPreset(newPreset);
    };

    /** 수동 새로고침 */
    const handleRefresh = () => {
        loadData();
    };

    // ----- Presenter 렌더링 -----

    return (
        <ModbusPresenter
            selectedDeviceId={selectedDeviceId}
            preset={preset}
            data={data}
            realtimeData={realtimeData}
            loading={loading}
            error={error}
            onDeviceChange={handleDeviceChange}
            onPresetChange={handlePresetChange}
            onRefresh={handleRefresh}
        />
    );
};
