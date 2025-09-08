/**
 * App 엔트리
 * - React Router 설정
 * - 각 페이지별 Container 연결
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Tabs from './components/layout/Tabs';
import HomeContainer from './pages/HomePage/HomeContainer';
import ModbusContainer from './pages/ModbusPage/ModbusContainer';

// TODO: Temp/Humidity/Solar 페이지 연결 시 Container 추가
function TempPage() {
    return <div style={{ padding: 16 }}>Temperature Page (준비 중)</div>;
}
function HumidityPage() {
    return <div style={{ padding: 16 }}>Humidity Page (준비 중)</div>;
}
function SolarPage() {
    return <div style={{ padding: 16 }}>Solar Page (준비 중)</div>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Tabs />
            <Routes>
                <Route path="/" element={<HomeContainer />} />
                <Route path="/modbus" element={<ModbusContainer />} />
                <Route path="/temp" element={<TempPage />} />
                <Route path="/humidity" element={<HumidityPage />} />
                <Route path="/solar" element={<SolarPage />} />
            </Routes>
        </BrowserRouter>
    );
}
