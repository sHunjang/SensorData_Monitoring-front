/**
 * EnvContainer.tsx
 * - 조회 버튼 클릭 시에만 /data/env/query 호출하도록 변경
 * - 상태(preset, data, stats, loading, error) 관리
 * - Presenter에 onQuery 핸들러 전달
 */
import { useState } from 'react';
import EnvPresenter from './EnvPresenter';
import { fetchEnvQuery, EnvResp } from '@/api/env';

export default function EnvContainer() {
    // 조회 조건: 기간 프리셋
    const [preset, setPreset] = useState<'15m' | '1h' | '1d' | '1w' | '1mo'>('1h');

    // 결과/상태
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 조회 버튼 클릭 시 실행
    const onQuery = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: EnvResp | null = await fetchEnvQuery({ preset, maxPoints: 500 });
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
        <EnvPresenter
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
