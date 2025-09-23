/**
 * DeviceCard.tsx
 *
 * 목적:
 * - 홈 대시보드에서 장치의 실시간 요약을 카드로 표시.
 *
 * props:
 * - title: 카드 제목
 * - phase: '3P3W' | '3P4W' (상태/설정 표시)
 * - kw: 실시간 전력(kW) 또는 null
 * - todayKwh: 당일 누적 전력(kWh) 또는 null
 * - error: 오류 메시지 있으면 ERR로 표시
 *
 * 동작:
 * - 값이 없거나 오류면 '-' 또는 'ERR' 로 안전 표시.
 * - UI는 단순 텍스트 기반. 필요시 스타일 확장.
 */
export default function DeviceCard({
    title,
    phase,
    kw,
    todayKwh,
    error,
}: {
    title: string;
    phase: '3P3W' | '3P4W';
    kw: number | null;
    todayKwh?: number | null;
    error?: string | null;
}) {
    const fmt = (v: number | null | undefined, digits = 2) =>
        typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '-';

    return (
        <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{title}</div>
                <span
                    title={error ? error : phase}
                    style={{
                        fontSize: 12,
                        background: error ? '#fff1f2' : '#eef2ff',
                        border: `1px solid ${error ? '#fecaca' : '#c7d2fe'}`,
                        color: error ? '#b91c1c' : '#3730a3',
                        padding: '2px 6px',
                        borderRadius: 6,
                    }}
                >
                    {error ? 'ERR' : phase}
                </span>
            </div>

            <div style={{ fontSize: 28, lineHeight: 1.2 }}>
                {error ? <span style={{ color: '#b91c1c' }}>ERR</span> : fmt(kw)}{' '}
                <span style={{ fontSize: 14 }}>kW</span>
            </div>

            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 8 }}>금일 누적: {fmt(todayKwh, 2)} kWh</div>
        </div>
    );
}
