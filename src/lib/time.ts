// src/lib/time.ts  (또는 기존 normalizeRows 구현을 이걸로 교체)
export function normalizeRows(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  // 보수적으로 정렬(시간 오름차순) 및 bucket을 epoch(ms)로 통일
  const mapped = raw.map(r => {
    const bucketRaw = r?.bucket ?? r?.time_stamp ?? r?.time ?? null;
    let bucketNum: number | null = null;
    if (bucketRaw == null) {
      bucketNum = null;
    } else if (typeof bucketRaw === "number") {
      // assume epoch ms
      bucketNum = bucketRaw;
    } else {
      // string -> parse (handles "2025-09-23T18:00:10+09:00")
      const parsed = Date.parse(String(bucketRaw));
      bucketNum = Number.isNaN(parsed) ? null : parsed;
    }
    return { ...r, bucket: bucketNum };
  });

  // filter out invalid bucket rows and sort ascending by bucket
  const valid = mapped.filter(m => m.bucket != null).sort((a, b) => a.bucket - b.bucket);
  // include also original rows that had null bucket if you want them:
  const invalid = mapped.filter(m => m.bucket == null);
  return [...valid, ...invalid];
}
