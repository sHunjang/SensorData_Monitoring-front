/**
 * LineChartWrapper.tsx
 * - 시계열 데이터를 Recharts로 라인 차트로 렌더링
 * - props:
 *   data   : [{ bucket: string, key1: number|null, key2: number|null, ... }]
 *   keys   : string[] → 차트에 표시할 데이터 키 목록
 *   labels : { key: "라벨명" }
 */
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: any[];
  keys: string[];
  labels: Record<string, string>;
};

export default function LineChartWrapper({ data, keys, labels }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="bucket"
          tickFormatter={(v) => new Date(v).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(v) => new Date(v).toLocaleString("ko-KR")}
          formatter={(value, name) => [
            value == null ? "-" : (value as number).toFixed(2),
            labels[name as string] ?? name,
          ]}
        />
        <Legend />
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b"][i % 5]} // 색상 순환
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
