// src/pages/Env/EnvContainer.tsx
import { useEffect, useState } from 'react';
import { fetchEnvQuery } from '@/api/env';
import EnvPresenter from './EnvPresenter';

export default function EnvContainer() {
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1d');
    const [data, setData] = useState<any[]>([]),
        [stats, setStats] = useState<any>({}),
        [loading, setLoading] = useState(false),
        [error, setError] = useState<string | null>(null);
    useEffect(() => {
        let on = true;
        setLoading(true);
        setError(null);
        fetchEnvQuery({ preset, maxPoints: 500 })
            .then((res) => {
                if (!on || !res) return;
                setData(res.data);
                setStats(res.stats);
            })
            .catch((e) => on && setError(e?.message ?? 'failed'))
            .finally(() => on && setLoading(false));
        return () => {
            on = false;
        };
    }, [preset]);
    return (
        <EnvPresenter preset={preset} setPreset={setPreset} data={data} stats={stats} loading={loading} error={error} />
    );
}
