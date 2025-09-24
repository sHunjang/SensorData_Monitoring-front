/**
 * ModbusPresenter.tsx
 *
 * 역할:
 * - ModbusContainer에서 전달된 상태/콜백으로 UI를 렌더링.
 * - single-column 레이아웃, 컨트롤(장치/시리즈/preset/mode), 차트, 통계, 로그를 표시.
 *
 * 주의:
 * - LineChartWrapper는 data[].bucket이 epoch(ms) 또는 parse 가능한 ISO 문자열이면 정상 동작.
 */

import React from 'react';
import styles from './Modbus.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import PeriodControls, { Preset } from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import SummaryText from '@/components/metrics/SummaryText';
import StatsPanel from '@/components/metrics/StatsPanel';

type Props = {
    deviceId: number;
    setDeviceId: (id: number) => void;
    deviceOptions: number[];
    column: 'power' | 'current' | 'voltage' | 'energy' | 'pf';
    setColumn: (c: any) => void;
    preset: Preset;
    setPreset: (p: Preset) => void;
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    onQuery: () => Promise<void> | void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];
};

export default function ModbusPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
    column,
    setColumn,
    preset,
    setPreset,
    mode,
    setMode,
    onQuery,
    data,
    stats,
    loading,
    error,
    logs,
}: Props) {
    const last = data?.length ? data[data.length - 1] : null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'grid', gap: 8 }}>
                    <SummaryText
                        title="실시간 전력"
                        unit="kW"
                        mode={mode}
                        realtimeValue={last?.power ?? last?.p_kw ?? null}
                        stats={stats?.power}
                    />
                    <SummaryText
                        title="당일 전력량"
                        unit="kWh"
                        mode={mode}
                        realtimeValue={last?.energy ?? last?.e_kwh ?? null}
                        stats={stats?.energy}
                    />
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar}>
                    <div className="row">
                        <label>Device</label>
                        <select value={deviceId} onChange={(e) => setDeviceId(Number(e.target.value))}>
                            {deviceOptions.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="row">
                        <label>Series</label>
                        <select value={column} onChange={(e) => setColumn(e.target.value as any)}>
                            <option value="power">Power (kW)</option>
                            <option value="energy">Energy (kWh)</option>
                            <option value="voltage">Voltage (V)</option>
                            <option value="current">Current (A)</option>
                            <option value="pf">Power Factor</option>
                        </select>
                    </div>

                    <div className="row">
                        <PeriodControls
                            mode={mode}
                            setMode={setMode}
                            preset={preset}
                            setPreset={setPreset}
                            onQuery={onQuery}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.card} style={{ height: 420 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={[column]} labels={{ [column]: column }} xKey="bucket" />
                )}
            </div>

            <div className={styles.card}>
                <StatsPanel title="통계" stats={stats ?? {}} />
            </div>

            <div className={styles.card}>
                <LogPanel logs={logs} />
            </div>
        </div>
    );
}
