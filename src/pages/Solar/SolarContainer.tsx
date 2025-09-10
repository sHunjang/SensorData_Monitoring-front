/**
 * SolarContainer.tsx
 * - 상태 관리 + API 호출 담당
 * - /data/solar/query 호출 → Presenter에 전달
 */
import { useEffect, useState } from 'react';
import SolarPresenter from './SolarPresenter';
import { fetchSolarQuery, SolarResp } from '@/api/solar';

export default function SolarContainer() {
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1d');
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        fetchSolarQuery({ preset, maxPoints: 500 })
            .then((res: SolarResp | null) => {
                if (!alive || !res) return;
                setData(res.data);
                setStats(res.stats);
            })
            .catch((e: any) => alive && setError(e?.message ?? 'failed'))
            .finally(() => alive && setLoading(false));

        return () => {
            alive = false;
        };
    }, [preset]);

    return (
        <SolarPresenter
            preset={preset}
            setPreset={setPreset}
            data={data}
            stats={stats}
            loading={loading}
            error={error}
        />
    );
}
