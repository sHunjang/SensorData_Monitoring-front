/**
 * Modbus 전력량계 프레젠터
 *
 * UI 렌더링
 */

import React, { useMemo } from 'react';
import { ModbusResponse } from '@/api/modbus';
import { LineChartWrapper } from '@/components/charts/LineChartWrapper';
import { DeviceCard } from '@/components/common/DeviceCard';
import { PeriodControls } from '@/components/common/PeriodControls';
import { StatsPanel } from '@/components/metrics/StatsPanel';
import { Loading } from '@/components/common/Loading';
import { Error } from '@/components/common/Error';
import { MODBUS_DEVICE_IDS } from '@/constants/devices';
import styles from './Modbus.module.css';

interface ModbusPresenterProps {
    selectedDeviceId: number;
    preset: '1m' | '15m';
    data: ModbusResponse | null;
    realtimeData: any;
    loading: boolean;
    error: string | null;
    onDeviceChange: (deviceId: number) => void;
    onPresetChange: (preset: '1m' | '15m') => void;
    onRefresh: () => void;
}

export const ModbusPresenter: React.FC<ModbusPresenterProps> = ({
    selectedDeviceId,
    preset,
    data,
    realtimeData,
    loading,
    error,
    onDeviceChange,
    onPresetChange,
    onRefresh,
}) => {
    // 통계 데이터
    const stats = useMemo(() => {
        if (!data?.stats) return [];

        return [
            { label: '평균 전력', value: data.stats.power.avg, unit: 'kW' },
            { label: '최대 전력', value: data.stats.power.max, unit: 'kW' },
            { label: '최소 전력', value: data.stats.power.min, unit: 'kW' },
            { label: '총 전력량', value: data.stats.energy.total, unit: 'kWh' },
        ];
    }, [data]);

    // 차트 키
    const chartKeys = useMemo(() => {
        if (!data?.series) return [];
        return data.series.filter((key) => key !== 'time');
    }, [data]);

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <h2>전력량계 모니터링</h2>
                <button onClick={onRefresh} className={styles.refreshButton}>
                    🔄 새로고침
                </button>
            </div>

            {/* 디바이스 선택 */}
            <div className={styles.deviceSelection}>
                <h3>디바이스 선택</h3>
                <div className={styles.deviceCards}>
                    {MODBUS_DEVICE_IDS.map((id) => (
                        <DeviceCard
                            key={id}
                            deviceId={id}
                            name={`전력량계 #${id}`}
                            selected={selectedDeviceId === id}
                            onClick={() => onDeviceChange(id)}
                        />
                    ))}
                </div>
            </div>

            {/* 기간 컨트롤 */}
            <PeriodControls preset={preset} onPresetChange={onPresetChange} />

            {/* 실시간 데이터 */}
            {realtimeData && (
                <div className={styles.realtimeSection}>
                    <h3>실시간 데이터</h3>
                    <div className={styles.realtimeGrid}>
                        <div className={styles.realtimeItem}>
                            <span>전력:</span>
                            <strong>{realtimeData.power?.toFixed(2) ?? '--'} kW</strong>
                        </div>
                        <div className={styles.realtimeItem}>
                            <span>전류:</span>
                            <strong>{realtimeData.current_l1?.toFixed(2) ?? '--'} A</strong>
                        </div>
                        <div className={styles.realtimeItem}>
                            <span>전압:</span>
                            <strong>{realtimeData.voltage_l1l2?.toFixed(2) ?? '--'} V</strong>
                        </div>
                        <div className={styles.realtimeItem}>
                            <span>역률:</span>
                            <strong>{realtimeData.power_factor?.toFixed(2) ?? '--'}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* 로딩 / 에러 / 차트 */}
            {loading && <Loading />}
            {error && <Error message={error} onRetry={onRefresh} />}

            {!loading && !error && data && (
                <>
                    {/* 통계 패널 */}
                    <StatsPanel stats={stats} />

                    {/* 차트 */}
                    <div className={styles.chartSection}>
                        <h3>데이터 차트</h3>
                        <LineChartWrapper
                            data={data.data}
                            keys={chartKeys}
                            preset={preset}
                            csvExport={{
                                filename: `modbus_${selectedDeviceId}_${preset}.csv`,
                                headers: ['time', ...chartKeys],
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
