// src/components/common/Header.tsx
/** 상단 헤더: 프로젝트 타이틀 + 서브텍스트 */
export default function Header() {
    return (
        <header style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
            <h1 style={{ margin: 0, fontSize: 18 }}>Sensor Monitoring</h1>
            <div style={{ opacity: 0.6, fontSize: 12 }}>TAC4300 + Env + Solar</div>
        </header>
    );
}
