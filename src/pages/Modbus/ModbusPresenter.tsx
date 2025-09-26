// src/pages/Modbus/ModbusPresenter.tsx
/**
 * ModbusPresenter.tsx
 *
 * - ModbusContainer에서 제공하는 상태/콜백을 받아 UI를 렌더링합니다.
 * - 레이아웃: 1열(반응형 유지), 상단 요약(SummaryText) / 컨트롤 / 차트 / 통계 / 로그 순으로 배치.
 * - 차트는 LineChartWrapper를 사용합니다. LineChartWrapper는 data[].bucket을 X축으로 사용합니다.
 *   normalizeRows에서 bucket을 ISO 문자열 또는 epoch(ms)로 바꿔주므로 여기서는 xKey="bucket"을 사용합니다.
 *
 * 사용법:
 * - onQuery 콜백은 Presenter에서 Refresh 버튼에 연결되어 있으며, mode에 따라 realtime/preset 동작을 수행합니다.
 * - csvExport: 차트 상단의 CSV 다운로드 버튼에서 사용됩니다.
 *
 * 주의:
 * - Presenter는 데이터의 alias(power, energy)가 container에서 보장된다고 가정합니다.
 * - 필요 시 Presenter에서 더 강한 방어적 필드를 읽도록 변경 가능합니다.
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
    // 마지막 행(가장 최신). container에서 normalizeRows 후 시간 오름차순/내림차순 처리에 따라
    // 최신 값이 배열 마지막에 오도록 container에서 맞춰두었음.
    const last = data?.length ? data[data.length - 1] : null;

    // SummaryText는 realtimeValue에 숫자만 받는 것이 편하므로 alias를 사용.
    const realtimePower: number | null = last?.power != null ? Number(last.power) : last?.total_active_power_kw ?? null;
    const realtimeEnergy: number | null =
        last?.energy != null ? Number(last.energy) : last?.total_active_energy_kwh ?? null;

    return (
        <div className={styles.container}>
            {/* 요약 카드: 실시간 전력 / 당일 전력량 */}
            <div className={styles.card}>
                <div style={{ display: 'grid', gap: 8 }}>
                    <SummaryText
                        title="실시간 전력"
                        unit="kW"
                        mode={mode}
                        realtimeValue={realtimePower}
                        stats={stats?.power}
                    />
                    <SummaryText
                        title="당일 전력량"
                        unit="kWh"
                        mode={mode}
                        realtimeValue={realtimeEnergy}
                        stats={stats?.energy}
                    />
                </div>
            </div>

            {/* 컨트롤: 장치 선택 / 시리즈 선택 / 기간 컨트롤 */}
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

                    <div className="row">
                        {/* 간단한 Refresh 버튼 (로딩 텍스트 생략 요청 반영) */}
                        <button onClick={() => onQuery()} className={styles.button}>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* 차트: 모듈화된 LineChartWrapper 사용.
          - keys: DB의 컬럼명을 넣고, container에서 alias(power/energy)를 만들어 둠.
          - xKey: "bucket" (normalizeRows에서 ISO 또는 epoch로 변환)
          - csvExport: 범위 다운로드를 지원하도록 apiPath와 device_id 전달 */}
            <div className={styles.card} style={{ height: 420 }}>
                <LineChartWrapper
                    data={data}
                    keys={['total_active_power_kw', 'total_active_energy_kwh']}
                    labels={{ total_active_power_kw: '전력 (kW)', total_active_energy_kwh: '에너지 (kWh)' }}
                    xKey="bucket"
                    csvExport={{
                        apiPath: '/data/modbus/query',
                        // 백엔드가 device_id 파라미터를 기대하므로 동일한 이름으로 전달
                        extraParams: { device_id: deviceId ?? undefined },
                        filePrefix: 'modbus',
                    }}
                />
            </div>

            {/* 통계 / 로그 */}
            <div className={styles.card}>
                <StatsPanel title="통계" stats={stats ?? {}} />
            </div>

            <div className={styles.card}>
                <LogPanel logs={logs} />
            </div>
        </div>
    );
}
