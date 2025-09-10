/**
 * DeviceCard.tsx
 * - 홈 대시보드에서 전력량계 1대를 카드 형태로 표시
 * - 실시간 kW 값, 위상 구성(3P3W/3P4W), 금일 kWh(추후 API 연결)를 렌더링
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
    return (
        <div className="card" style={{ padding: 12 }}>
            {/* 카드 헤더 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                }}
            >
                <div style={{ fontWeight: 700 }}>{title}</div>
                <span
                    style={{
                        fontSize: 12,
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        color: '#3730a3',
                        padding: '2px 6px',
                        borderRadius: 6,
                    }}
                >
                    {phase}
                </span>
            </div>

            {/* 실시간 전력 */}
            <div style={{ fontSize: 28, lineHeight: 1.2 }}>
                {error ? <span style={{ color: '#b91c1c' }}>ERR</span> : kw ?? '-'}{' '}
                <span style={{ fontSize: 14 }}>kW</span>
            </div>

            {/* 금일 누적 전력량 */}
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                금일 누적: {todayKwh == null ? '-' : todayKwh} kWh
            </div>
        </div>
    );
}
