// src/components/metrics/StatsPanel.tsx
/** 통계 패널: 평균/최대/최소/개수 */
export default function StatsPanel({ stats, labels }: { stats: Record<string, any>; labels: Record<string, string> }) {
    const entries = Object.entries(stats || {});
    if (!entries.length) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {entries.map(([k, s]) => (
                <div key={k} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, background: '#fff' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{labels[k] ?? k}</div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            rowGap: 6,
                            columnGap: 10,
                            fontSize: 14,
                        }}
                    >
                        <div>평균</div>
                        <div style={{ textAlign: 'right' }}>{s?.avg ?? '-'}</div>
                        <div>최소</div>
                        <div style={{ textAlign: 'right' }}>{s?.min ?? '-'}</div>
                        <div>최대</div>
                        <div style={{ textAlign: 'right' }}>{s?.max ?? '-'}</div>
                        <div>개수</div>
                        <div style={{ textAlign: 'right' }}>{s?.count ?? '-'}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
