/**
 * Error.tsx
 *
 * 목적:
 * - 카드나 패널 내부에서 사용자에게 에러 메시지를 친절하게 보여주기 위해 사용.
 *
 * 동작:
 * - 단순 박스형 경고.
 * - 메시지는 pre-wrap으로 여러 줄 출력 가능.
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
                whiteSpace: 'pre-wrap',
            }}
        >
            <span style={{ fontWeight: 700 }}>⚠ 에러 발생:</span>
            <span>{msg}</span>
        </div>
    );
}
