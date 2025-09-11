/**
 * SolarContainer.tsx
 * - 조회 버튼 클릭 시에만 /data/solar/query 호출
 * - 상태(preset, data, stats, loading, error) 관리
 * - Presenter에 onQuery 핸들러 전달
 */
import { useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery, SolarResp } from '@/api/solar';

export default function SolarContainer() {
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1h');
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onQuery = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: SolarResp | null = await fetchSolarQuery({ preset, maxPoints: 500 });
            if (res) {
                setData(res.data);
                setStats(res.stats);
            }
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? e?.message ?? 'unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SolarPresenter
            preset={preset}
            setPreset={setPreset}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
            onQuery={onQuery} // 조회 버튼 핸들러 전달
        />
    );
}
