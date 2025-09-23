// src/pages/Env/EnvPresenter.tsx
/**
 * EnvPresenter
 *
 * 목적:
 * - EnvContainer에서 제공하는 상태를 받아 UI로 렌더링.
 * - 차트, 통계, 로그, 컨트롤을 배치.
 * - 장치 선택(deviceId)을 지원하여 특정 센서(예: 21,22,23)만 조회 가능.
 *
 * 사용법:
 * - 컨테이너는 deviceId: number | null 과 setDeviceId: (id: number|null) => void 를 전달해야 함.
 * - onQuery는 deviceId 상태를 반영한 fetch 호출을 수행해야 함.
 */
import styles from './Env.module.css';
import LineChartWrapper from '@/components/charts/LineChartWrapper';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import PeriodControls, { Preset } from '@/components/common/PeriodControls';
import LogPanel from '@/components/common/LogPanel';
import StatsPanel from '@/components/metrics/StatsPanel';
import SummaryText from '@/components/metrics/SummaryText';
import React from 'react';

export default function EnvPresenter(p: {
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    preset: Preset;
    setPreset: (p: Preset) => void;
    onQuery: () => void;
    data: any[];
    stats: any;
    loading: boolean;
    error: string | null;
    logs: string[];
    deviceId?: number | null;
    setDeviceId?: (id: number | null) => void;
}) {
    const {
        mode, setMode, preset, setPreset, onQuery,
        data, stats, loading, error, logs,
        deviceId, setDeviceId
    } = p;

    // 기본 장치 목록. 필요시 컨테이너 또는 서버에서 동적으로 공급하도록 변경 가능.
    const deviceOptions = [21, 22, 23];

    const last = data?.length ? data[data.length - 1] : null;

    // 장치 선택이 변경되면 즉시 쿼리 실행
    const handleDeviceChange = (v: string) => {
        if (!setDeviceId) return;
        const id = v === '' ? null : Number(v);
        setDeviceId(id);
        // 선택 즉시 데이터 갱신 요청
        try { onQuery(); } catch { /* onQuery may be sync/async; ignore errors here */ }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'grid', gap: 6 }}>
                    <SummaryText
                        title="온도"
                        unit="°C"
                        mode={mode}
                        realtimeValue={last?.temperature ?? null}
                        stats={stats?.temperature}
                    />
                    <SummaryText
                        title="습도"
                        unit="%"
                        mode={mode}
                        realtimeValue={last?.humidity ?? null}
                        stats={stats?.humidity}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <PeriodControls
                    mode={mode}
                    setMode={setMode}
                    preset={preset}
                    setPreset={setPreset}
                    onQuery={onQuery}
                    loading={loading}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 13 }}>Device</label>
                    {setDeviceId ? (
                        <select
                            value={deviceId ?? ''}
                            onChange={(e) => handleDeviceChange(e.target.value)}
                            style={{ padding: '4px 8px' }}
                        >
                            <option value=''>All</option>
                            {deviceOptions.map((id) => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ paddingLeft: 8 }}>{deviceId ?? 'All'}</div>
                    )}
                </div>

                <div style={{ marginLeft: 'auto' }}>
                    <button onClick={() => onQuery()} disabled={loading}>Refresh</button>
                </div>
            </div>

            <div className={styles.card} style={{ height: 360 }}>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <Error msg={error} />
                ) : (
                    <LineChartWrapper
                        data={data}
                        keys={['temperature', 'humidity']}
                        labels={{ temperature: '온도(°C)', humidity: '습도(%)' }}
                    />
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
