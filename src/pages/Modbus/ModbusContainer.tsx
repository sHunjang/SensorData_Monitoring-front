/**
 * ModbusContainer.tsx
 * - 전력량계 페이지 상태 관리 및 API 호출
 * - 선택된 장치 ID, 컬럼, 기간(preset/start/end)을 관리
 * - 조회 버튼/좌우 이동/줌인아웃 이벤트를 처리
 */
import { useState } from "react";
import ModbusPresenter from "./ModbusPresenter";
import { fetchModbusQuery, ModbusQueryResp } from "@/api/modbus";
import { DEVICES } from "@/constants/devices";

export default function ModbusContainer() {
  const [deviceId, setDeviceId] = useState<number>(11);
  const [column, setColumn] = useState<string>("total_active_energy_kWh");
  const [preset, setPreset] = useState<"15m" | "1h" | "1d" | "1w" | "1mo">("1h");
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ModbusQueryResp | null = await fetchModbusQuery({
        deviceId,
        series: [column],
        preset,
        maxPoints: 500,
      });
      if (res) {
        setData(res.data);
        setStats(res.stats);
      }
    } catch (e: any) {
      setError(e?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  };

  // 좌우 이동: start/end 이동 (간단히 preset 기준 이동)
  const handleShift = async (dir: "left" | "right") => {
    // TODO: 실제 start/end 기반 이동 구현
    alert(`Shift ${dir} (추후 start/end 기반 구현)`);
  };

  // 줌인/줌아웃: preset 변경
  const handleZoom = (dir: "in" | "out") => {
    const order: Array<"15m" | "1h" | "1d" | "1w" | "1mo"> = ["15m", "1h", "1d", "1w", "1mo"];
    const idx = order.indexOf(preset);
    if (dir === "in" && idx > 0) setPreset(order[idx - 1]);
    if (dir === "out" && idx < order.length - 1) setPreset(order[idx + 1]);
  };

  return (
    <ModbusPresenter
      deviceId={deviceId}
      setDeviceId={setDeviceId}
      column={column}
      setColumn={setColumn}
      preset={preset}
      setPreset={setPreset}
      onQuery={handleQuery}
      onShift={handleShift}
      onZoom={handleZoom}
      data={data}
      stats={stats}
      loading={loading}
      error={error}
    />
  );
}
