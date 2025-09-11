/**
 * Error.tsx
 * - 에러 메시지를 박스 형태로 표시
 * - 어떤 에러인지 상세 메시지까지 보여줌
 */
export default function Error({ msg }: { msg: string }) {
    return (
        <div
            style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'pre-wrap', // 줄바꿈 유지
            }}
        >
            <span style={{ fontWeight: 700 }}>⚠ 에러 발생:</span>
            <span>{msg}</span>
        </div>
    );
}
