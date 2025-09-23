// src/components/metrics/SummaryText.tsx
/**
 * SummaryText
 *
 * - realtimeValue: number | string | object | undefined
 *   (프론트의 다양한 실시간 응답 형태를 방어적으로 처리)
 * - stats: { avg, max, min, count } 형태를 기대 (있으면 표시)
 *
 * 동작:
 * - realtimeValue가 number이면 그대로 사용
 * - realtimeValue가 문자열이면 숫자 파싱 시도
 * - realtimeValue가 객체이면 우선순위 후보 키 목록에서 숫자를 찾아 사용
 * - 숫자 없으면 null 처리하고 UI는 '-' 표시
 *
 * 후보 키 목록은 프로젝트에서 흔히 쓰는 이름들을 포함한다.
 * 필요하면 후보 키 목록에 추가하자.
 */

import React from 'react';
import styles from './SummaryText.module.css'; // 없으면 기본 스타일로 대체

type Stats = { avg?: number | null; max?: number | null; min?: number | null; count?: number };

export default function SummaryText(props: {
    title: string;
    unit?: string;
    mode?: 'realtime' | 'range';
    realtimeValue?: any;
    stats?: Stats | null;
}) {
    const { title, unit = '', mode = 'realtime', realtimeValue, stats } = props;

    // 후보 키 목록: 실제 프로젝트에서 사용되는 필드명 우선순위로 둠.
    const CANDIDATE_KEYS = [
        'metrics.p_kw',
        'metrics.e_kwh',
        'metrics.p_kw',
        'p_kw',
        'e_kwh',
        'power',
        'energy',
        'total_active_power_kw',
        'total_active_energy_kwh',
        'total_active_kw',
        'total_active_energy_kwh',
        'value',
        'val',
    ];

    // 객체에서 경로(keypath)로 값 가져오기 (e.g. "metrics.p_kw")
    function getByPath(obj: any, path: string) {
        if (!obj || typeof obj !== 'object') return undefined;
        const parts = path.split('.');
        let cur: any = obj;
        for (const p of parts) {
            if (cur == null) return undefined;
            cur = cur[p];
        }
        return cur;
    }

    // 숫자인지 판별 (숫자문자열도 허용)
    function toNumberOrNull(x: any): number | null {
        if (x == null) return null;
        if (typeof x === 'number') {
            return Number.isFinite(x) ? x : null;
        }
        if (typeof x === 'string') {
            const n = Number(x);
            return Number.isFinite(n) ? n : null;
        }
        return null;
    }

    // realtimeValue에서 숫자 추출
    function extractValue(rv: any): number | null {
        // 1) 직접 숫자/숫자문자열
        const direct = toNumberOrNull(rv);
        if (direct !== null) return direct;

        // 2) 객체인 경우: 후보 키 순회
        if (rv && typeof rv === 'object') {
            for (const key of CANDIDATE_KEYS) {
                const v = getByPath(rv, key);
                const n = toNumberOrNull(v);
                if (n !== null) return n;
            }
            // 3) 객체의 최상위 값들 중 숫자 찾기 (예: {p_kw:..., other:...})
            for (const k of Object.keys(rv)) {
                const n = toNumberOrNull(rv[k]);
                if (n !== null) return n;
            }
            // 4) metrics 프로퍼티가 객체이면 그 안에서 숫자 찾기
            if (rv.metrics && typeof rv.metrics === 'object') {
                for (const k of Object.keys(rv.metrics)) {
                    const n = toNumberOrNull(rv.metrics[k]);
                    if (n !== null) return n;
                }
            }
        }

        return null;
    }

    const value = extractValue(realtimeValue);

    return (
        <div className={styles.summary ?? ''} style={{ padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>
                {value == null ? '-' : `${value}${unit ? ' ' + unit : ''}`}
            </div>

            {mode === 'range' && stats ? (
                <div style={{ fontSize: 12, color: '#444', marginTop: 8 }}>
                    <div>avg: {stats?.avg ?? '-'}</div>
                    <div>max: {stats?.max ?? '-'}</div>
                    <div>min: {stats?.min ?? '-'}</div>
                </div>
            ) : null}
        </div>
    );
}
