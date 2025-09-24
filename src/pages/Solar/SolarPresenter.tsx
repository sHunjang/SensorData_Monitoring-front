// src/pages/Solar/SolarPresenter.tsx
/**
 * SolarPresenter
 *
 * - SolarContainer에서 공급한 data/stats/ui 상태를 렌더링
 * - 차트 부모 컨테이너에 고정 높이를 줘서 Recharts가 렌더링할 공간을 확보함.
 *
 * 중요: LineChartWrapper가 높이를 100%로 사용하므로 이 부모에 높이(style) 필수.
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
    onQuery: () => void;
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

    const realtimeSolarValue: number | null =
        last?.solar != null
            ? Number(last.solar)
            : last?.solar_irradiance_wm2 != null
            ? Number(last.solar_irradiance_wm2)
            : null;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'grid', gap: 8 }}>
                    <SummaryText
                        title="일사량"
                        unit="W/m²"
                        mode={mode}
                        realtimeValue={realtimeSolarValue}
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

                </div>
            </div>

            {/* 차트 컨테이너에 고정 높이(예: 360px) 지정 */}
            <div className={styles.card} style={{ height: 360 }}>
                {error ? (
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
