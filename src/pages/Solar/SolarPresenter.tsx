/**
 * SolarPresenter.tsx
 *
 * 역할:
 * - SolarContainer에서 전달된 상태를 UI로 렌더링.
 * - Device 선택, Preset/Mode 컨트롤, 차트, 통계, 로그를 표시.
 */

import React from 'react';
import styles from './Solar.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import PeriodControls, { Preset } from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';

type Props = {
    deviceId: number | null;
    setDeviceId: (id: number | null) => void;
    deviceOptions: number[];
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

export default function SolarPresenter({
    deviceId,
    setDeviceId,
    deviceOptions,
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
                        title="일사량"
                        unit="W/m²"
                        mode={mode}
                        realtimeValue={last?.solar ?? null}
                        stats={stats?.solar}
                    />
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.controls}>
                    <div className="row">
                        <label>Device</label>
                        <select
                            value={deviceId ?? ''}
                            onChange={(e) => setDeviceId(e.target.value === '' ? null : Number(e.target.value))}
                        >
                            <option value="">All</option>
                            {deviceOptions.map((id) => (
                                <option key={id} value={id}>
                                    {id}
                                </option>
                            ))}
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

                    <div className="row">
                        <button onClick={() => onQuery()} disabled={loading}>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.card} style={{ height: 360 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper data={data} keys={['solar']} labels={{ solar: '일사량 (W/m²)' }} xKey="bucket" />
                )}
            </div>

            <div className={styles.card}>
                <StatsPanel title="요약 통계" stats={stats ?? {}} />
            </div>

            <div className={styles.card}>
                <LogPanel logs={logs} />
            </div>
        </div>
    );
}
