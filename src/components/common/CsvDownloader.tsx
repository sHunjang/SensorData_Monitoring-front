// src/components/common/CsvDownloader.tsx
/**
 * CsvDownloader
 *
 * 재사용 가능한 CSV 다운로드 위젯.
 * - apiPath: 서버의 query 엔드포인트 경로 (예: "/data/solar/query")
 * - extraParams: device_id 등 추가 고정 쿼리 파라미터
 * - filePrefix: 다운로드 파일 이름 앞부분 (예: "solar")
 *
 * 동작:
 * 1) 시작/종료 기간을 datetime-local 입력으로 받고
 * 2) 서버에 start/end (ISO string, UTC)로 요청
 * 3) 서버 응답의 .data 배열을 CSV로 변환하여 다운로드
 *
 * 주의:
 * - 서버 응답 스키마: { data: [ { bucket: "...", device_id: N, ... }, ... ] } 형태를 기대
 * - bucket이 epoch(ms) 숫자인 경우 Date를 ISO로 변환해서 저장
 */

import React, { useState } from 'react';

type Props = {
    apiPath: string; // "/data/solar/query"
    extraParams?: Record<string, string | number | undefined>;
    filePrefix?: string;
    defaultRangeHours?: number; // 기본 기간: 최근 n 시간
};

function isoFromLocalInput(val: string | null): string | null {
    // <input type="datetime-local"> 값은 로컬타임(예: "2025-09-24T10:00")
    // 이를 서버에 보낼 때는 ISO UTC로 변환해서 보냄 (new Date(..).toISOString()).
    if (!val) return null;
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString(); // UTC with Z
}

function toCsv(rows: any[]): string {
    if (!Array.isArray(rows) || rows.length === 0) return '';

    // 칼럼: rows[0]의 키를 기준으로 정렬(예측 가능한 순서)
    const keys = Object.keys(rows[0]);

    // CSV escape
    const esc = (v: any) => {
        if (v == null) return '';
        const s = String(v);
        // 따옴표 이스케이프
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const header = keys.join(',');
    const lines = rows.map((r) =>
        keys
            .map((k) => {
                let v = r[k];
                // bucket이 숫자(epoch)면 ISO로 변환해 가독성 제공
                if (k === 'bucket' && typeof v === 'number') {
                    v = new Date(v).toISOString();
                }
                return esc(v);
            })
            .join(',')
    );
    return [header, ...lines].join('\n');
}

export default function CsvDownloader({
    apiPath,
    extraParams = {},
    filePrefix = 'data',
    defaultRangeHours = 1,
}: Props) {
    const now = new Date();
    const defaultEnd = new Date(now.getTime());
    const defaultStart = new Date(now.getTime() - defaultRangeHours * 60 * 60 * 1000);

    // datetime-local expects local date string without timezone
    const fmtLocal = (d: Date) => {
        // YYYY-MM-DDTHH:mm
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
            d.getMinutes()
        )}`;
    };

    const [startLocal, setStartLocal] = useState<string>(fmtLocal(defaultStart));
    const [endLocal, setEndLocal] = useState<string>(fmtLocal(defaultEnd));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = async () => {
        setError(null);
        const startIso = isoFromLocalInput(startLocal);
        const endIso = isoFromLocalInput(endLocal);
        if (!startIso || !endIso) {
            setError('기간을 정확히 선택하세요.');
            return;
        }
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.append('start', startIso);
            qs.append('end', endIso);
            // append extra params
            Object.entries(extraParams).forEach(([k, v]) => {
                if (v === undefined || v === null || v === '') return;
                qs.append(k, String(v));
            });
            // 요청: 상대경로 사용. Vite proxy가 있으면 /data/... 그대로 동작.
            const url = `${apiPath}?${qs.toString()}`;

            const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`HTTP ${res.status}: ${txt}`);
            }
            const json = await res.json();
            const rows = Array.isArray(json?.data) ? json.data : [];
            const csv = toCsv(rows);
            if (!csv) {
                setError('다운로드할 데이터가 없습니다.');
                setLoading(false);
                return;
            }

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const filename = `${filePrefix}_${startIso.substring(0, 19).replace(/[:T]/g, '-')}_to_${endIso
                .substring(0, 19)
                .replace(/[:T]/g, '-')}.csv`;

            // 트리거 다운로드
            const link = document.createElement('a');
            const urlBlob = URL.createObjectURL(blob);
            link.href = urlBlob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(urlBlob);
        } catch (e: any) {
            setError(e?.message ?? '다운로드 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12 }}>
                시작
                <input
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                    style={{ marginLeft: 6 }}
                />
            </label>
            <label style={{ fontSize: 12 }}>
                종료
                <input
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    style={{ marginLeft: 6 }}
                />
            </label>

            <button onClick={handleDownload} disabled={loading} className="button">
                {loading ? '다운로드 준비중...' : 'CSV 다운로드'}
            </button>

            {error ? <div style={{ color: 'crimson', fontSize: 12 }}>{error}</div> : null}
        </div>
    );
}
