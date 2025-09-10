/**
 * 전력 프레젠터 (풀네임 컬럼 적용 + 드롭다운 다중 선택)
 * - 드롭다운에서 "총 전력량 (kWh)" 선택하면 total_active_energy_kWh 그래프 표시
 */
import { useState } from 'react';
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatsPanel from '@/components/metrics/StatsPanel';
import { SERIES_LABELS } from '@/constants/labels';

export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    preset,
    setPreset,
    data,
    stats,
    loading,
    error,
}: {
    deviceId: number;
    setDeviceId: (n: number) => void;
    preset: '15m' | '1h' | '1d' | '1w' | '1mo';
    setPreset: (p: any) => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
}) {
    // 기본 선택 컬럼 → 총 전력량 (kWh)
    const [selectedKeys, setSelectedKeys] = useState<string[]>(['total_active_energy_kwh']);

    const availableKeys: string[] = [
        'total_active_power_kW',
        'total_reactive_power_kvar',
        'total_apparent_power_kVA',
        'avg_power_factor',
        'sum_line_currents_A',
        'avg_line_current_A',
        'avg_line_to_line_volts_V',
        'avg_line_to_neutral_volts_V',
        'total_active_energy_kwh', // ✅ 총 전력량
        'total_reactive_energy_kvarh',
        'total_apparent_energy_kVAh',
    ];

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
        setSelectedKeys(values);
    };

    return (
        <div className={styles.container}>
            {/* 제어 영역 */}
            <div className={styles.controls}>
                <label>
                    Device&nbsp;
                    <select
                        value={deviceId}
                        onChange={(e) => setDeviceId(parseInt(e.target.value, 10))}
                        className={styles.input}
                    >
                        {[11, 12, 13, 14, 15].map((id) => (
                            <option key={id} value={id}>
                                {id}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Interval&nbsp;
                    <select value={preset} onChange={(e) => setPreset(e.target.value)} className={styles.input}>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="1d">1d</option>
                        <option value="1w">1w</option>
                        <option value="1mo">1mo</option>
                    </select>
                </label>

                <label>
                    항목 선택&nbsp;
                    <select multiple value={selectedKeys} onChange={handleSelectChange} className={styles.multiSelect}>
                        {availableKeys.map((key) => (
                            <option key={key} value={key}>
                                {SERIES_LABELS[key] ?? key}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* 차트 */}
            <div className={styles.card} style={{ height: 450 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={selectedKeys} labels={SERIES_LABELS} />
                )}
            </div>

            {/* 통계 */}
            <div className={styles.card}>
                <h3 className={styles.section}>요약 통계</h3>
                <StatsPanel
                    stats={stats}
                    labels={SERIES_LABELS}
                    selectedKeys={selectedKeys}
                />
            </div>
        </div>
    );
}
