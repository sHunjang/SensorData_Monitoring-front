import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function LogPanel({ logs }) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current?.scrollTo({ top: ref.current.scrollHeight });
    }, [logs]);
    return (_jsxs("div", { className: styles.wrap, children: [_jsx("div", { className: styles.header, children: "\uB85C\uADF8" }), _jsx("div", { className: styles.body, ref: ref, children: logs.length === 0 ? (_jsx("div", { className: styles.empty, children: "\uB85C\uADF8 \uC5C6\uC74C" })) : (logs.map((l, i) => (_jsx("div", { className: styles.line, children: l }, i)))) })] }));
}
