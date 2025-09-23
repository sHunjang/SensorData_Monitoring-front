// src/lib/time.ts
/**
 * 시간 유틸
 * - 서버에서 받은 bucket (ISO string | number | Date)을 epoch ms 숫자로 정규화
 * - 파싱 실패 시 null 반환
 */
export function toEpochMs(bucket: string | number | Date | null | undefined): number | null {
    if (bucket == null) return null;
    if (typeof bucket === "number" && Number.isFinite(bucket)) return bucket;
    if (bucket instanceof Date && !Number.isNaN(bucket.getTime())) return bucket.getTime();
    const ms = Date.parse(String(bucket)); // tz-aware ISO 지원
    return Number.isNaN(ms) ? null : ms;
}

export function normalizeRows(rawRows: any[], keepNullBucket = false) {
    // bucket 필드를 epoch ms로 변환 후 정렬. bucket이 없는 행은 제거(옵션에 따라 유지).
    const rows = rawRows
        .map((r) => {
            const epoch = toEpochMs(r.bucket ?? r.time_stamp ?? r.timestamp);
            return { ...r, bucket: epoch };
        })
        .filter((r) => (keepNullBucket ? true : r.bucket != null));
    rows.sort((a, b) => (a.bucket ?? 0) - (b.bucket ?? 0));
    return rows;
}
