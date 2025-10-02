/**
 * LogPanel.tsx
 *
 * 목적:
 * - 내부 로그(배열) 를 스크롤 가능한 패널로 표시.
 * - 변경 시 자동으로 하단으로 스크롤.
 *
 * props:
 * - logs: string[]
 *
 * 주의:
 * - 로그 길이가 매우 길면 메모리 증가 가능. 상위 컴포넌트에서 cap 처리 권장.
 */
import { useEffect, useRef } from 'react';
import styles from './LogPanel.module.css';

export default function LogPanel({ logs }: { logs: string[] }) {
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        ref.current?.scrollTo({ top: ref.current.scrollHeight });
    }, [logs]);
    return (
        <div className={styles.wrap}>
            <div className={styles.header}>로그</div>
            <div className={styles.body} ref={ref}>
                {logs.length === 0 ? (
                    <div className={styles.empty}>로그 없음</div>
                ) : (
                    logs.map((l, i) => (
                        <div key={i} className={styles.line}>
                            {l}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
