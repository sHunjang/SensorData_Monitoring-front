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
                padding: '16px',
                margin: '16px 0',
                borderRadius: '8px',
                backgroundColor: '#fff1f0',
                border: '1px solid #ffa39e',
                color: '#cf1322',
            }}
        >
            <strong>⚠️ 오류:</strong>
            <pre
                style={{
                    margin: '8px 0 0',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                }}
            >
                {msg}
            </pre>
        </div>
    );
}
