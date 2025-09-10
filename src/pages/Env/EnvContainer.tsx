/**
 * EnvContainer.tsx
 * - /data/env/query 호출
 * - 상태(preset, data, stats, loading, error) 관리
 */
import { useEffect, useState } from "react";
import EnvPresenter from "./EnvPresenter";
import { fetchEnvQuery, EnvResp } from "@/api/env";

export default function EnvContainer() {
  const [preset, setPreset] = useState<"15m" | "1h" | "1d" | "1w" | "1mo">("1h");
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchEnvQuery({ preset, maxPoints: 500 })
      .then((res: EnvResp | null) => {
        if (!alive || !res) return;
        setData(res.data);
        setStats(res.stats);
      })
      .catch((e: any) => alive && setError(e?.message ?? "failed"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [preset]);

  return (
    <EnvPresenter
      preset={preset}
      setPreset={setPreset}
      data={data}
      stats={stats}
      loading={loading}
      error={error}
    />
  );
}
