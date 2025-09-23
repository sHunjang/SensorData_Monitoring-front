/**
 * PeriodControls.tsx
 *
 * 목적:
 * - 시간 범위 선택(프리셋)과 모드(realtime/range) 선택 UI 제공
 *
 * props:
 * - mode, setMode, preset, setPreset, onQuery, loading
 *
 * 주의:
 * - 프리셋 값은 백엔드와 완전 일치해야 함 (예: '15m','1h','1d','1w','1mo')
 */
import styles from './PeriodControls.module.css';
export type Preset = '15m' | '1h' | '1d' | '1w' | '1mo';

export default function PeriodControls(props: {
    mode: 'realtime' | 'range';
    setMode: (m: 'realtime' | 'range') => void;
    preset: Preset;
    setPreset: (p: Preset) => void;
    onQuery: () => void;
    loading: boolean;
}) {
    const { mode, setMode, preset, setPreset, onQuery, loading } = props;
    return (
        <div className={styles.controls}>
            <label className={styles.row}>
                모드
                <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={styles.input}>
                    <option value="realtime">실시간</option>
                    <option value="range">기간</option>
                </select>
            </label>

            {mode === 'range' && (
                <label className={styles.row}>
                    기간
                    <select
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as Preset)}
                        className={styles.input}
                    >
                        <option value="15m">15분</option>
                        <option value="1h">1시간</option>
                        <option value="1d">1일</option>
                        <option value="1w">1주</option>
                        <option value="1mo">1개월</option>
                    </select>
                </label>
            )}

            <button onClick={onQuery} className={styles.button} disabled={loading}>
                {loading ? '조회 중...' : mode === 'realtime' ? '즉시 새로고침' : '기간 조회'}
            </button>
        </div>
    );
}
