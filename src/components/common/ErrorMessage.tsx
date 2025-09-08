/**
 * 공용 에러 메시지
 */
type Props = { message?: string };
export default function ErrorMessage({ message = '에러가 발생했습니다.' }: Props) {
    return (
        <div
            style={{
                padding: 12,
                borderRadius: 8,
                background: '#fdecea',
                color: '#b71c1c',
                border: '1px solid #f5c6c4',
            }}
        >
            {message}
        </div>
    );
}
