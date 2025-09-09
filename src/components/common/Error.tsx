// src/components/Error.tsx
export default function Error({ msg }: { msg: string }) {
    return <div style={{ color: '#b91c1c' }}>에러: {msg}</div>;
}
