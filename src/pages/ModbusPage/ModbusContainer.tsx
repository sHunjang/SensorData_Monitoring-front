import { useState } from 'react';
import ModbusPresenter from './ModbusPresenter';

type Stat = { avg: number | null; max: number | null; min: number | null; count: number };
type QueryResult = {
    window: { start: string; end: string };
    bucket_seconds: number;
    series: string[];
    device_id: number;
    data: any[];
    stats: Record<string, Stat>;
};

export default function ModbusContainer() {
    const [deviceId, setDeviceId] = useState(11);
    const [series, setSeries] = useState('p_total');
    const [preset, setPreset] = useState('1h');
    const [result, setResult] = useState<QueryResult | null>(null);

    /** 더미데이터 생성 */
    const generateMockData = (from: Date, to: Date, points: number = 20): QueryResult => {
        const step = (to.getTime() - from.getTime()) / points;
        const data = Array.from({ length: points }).map((_, i) => {
            const ts = new Date(from.getTime() + i * step);
            return {
                bucket: ts.toISOString(),
                p_total: Math.random() * 5 + 1,
                voltage: 220 + Math.random() * 10,
                current: Math.random() * 10,
            };
        });

        return {
            window: { start: from.toISOString(), end: to.toISOString() },
            bucket_seconds: step / 1000,
            series: ['p_total', 'voltage', 'current'],
            device_id: deviceId,
            data,
            stats: {
                [series]: {
                    avg: parseFloat((data.reduce((a, b) => a + (b as any)[series], 0) / data.length).toFixed(2)),
                    max: parseFloat(Math.max(...data.map((d) => (d as any)[series])).toFixed(2)),
                    min: parseFloat(Math.min(...data.map((d) => (d as any)[series])).toFixed(2)),
                    count: data.length,
                },
            },
        };
    };

    /** 조회 */
    const handleQuery = (customStart?: string, customEnd?: string) => {
        const now = new Date();
        const from = customStart ? new Date(customStart) : new Date(now.getTime() - 60 * 60 * 1000);
        const to = customEnd ? new Date(customEnd) : now;
        const mock = generateMockData(from, to);
        setResult(mock);
    };

    /** 이전(◀) */
    const handlePrev = () => {
        if (!result) return;
        const s = new Date(result.window.start);
        const e = new Date(result.window.end);
        const spanMs = e.getTime() - s.getTime();
        handleQuery(new Date(s.getTime() - spanMs).toISOString(), new Date(e.getTime() - spanMs).toISOString());
    };

    /** 다음(▶) */
    const handleNext = () => {
        if (!result) return;
        const s = new Date(result.window.start);
        const e = new Date(result.window.end);
        const spanMs = e.getTime() - s.getTime();
        handleQuery(new Date(s.getTime() + spanMs).toISOString(), new Date(e.getTime() + spanMs).toISOString());
    };

    /** 확대(+) */
    const handleZoomIn = () => {
        if (!result) return;
        const s = new Date(result.window.start);
        const e = new Date(result.window.end);
        const spanMs = e.getTime() - s.getTime();
        const mid = (s.getTime() + e.getTime()) / 2;
        handleQuery(new Date(mid - spanMs / 4).toISOString(), new Date(mid + spanMs / 4).toISOString());
    };

    /** 축소(-) */
    const handleZoomOut = () => {
        if (!result) return;
        const s = new Date(result.window.start);
        const e = new Date(result.window.end);
        const spanMs = e.getTime() - s.getTime();
        const mid = (s.getTime() + e.getTime()) / 2;
        handleQuery(new Date(mid - spanMs).toISOString(), new Date(mid + spanMs).toISOString());
    };

    return (
        <ModbusPresenter
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            series={series}
            setSeries={setSeries}
            preset={preset}
            setPreset={setPreset}
            result={result}
            onQuery={() => handleQuery()}
            onPrev={handlePrev}
            onNext={handleNext}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
        />
    );
}
