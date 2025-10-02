/**
 * src/lib/time.ts
 *
 * 목적:
 * - 서버 응답(rows)을 프론트에서 일관되게 사용할 수 있도록 정규화(normalize)한다.
 * - 반드시 다음을 보장:
 *    1) row.bucket 은 epoch(ms) 숫자 또는 null
 *    2) 주요 수치 필드(예: solar)는 number 또는 null
 *    3) device_id는 number 또는 null
 *
 * 사용:
 *   import { normalizeRows } from "@/lib/time";
 *   const rows = normalizeRows(serverResp.data);
 *
 * 주의:
 * - 서버에서 이미 epoch(ms)를 보내는 경우에도 안전하게 처리.
 * - 문자열 ISO를 Date.parse로 변환. 파싱 불가 시 bucket=null로 둔다.
 */

export function normalizeRows(rows: any[] = []): any[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((r) => {
    const out: any = { ...r };

    // bucket 후보: bucket, time_stamp, timestamp
    const cand = out.bucket ?? out.time_stamp ?? out.timestamp ?? null;
    let bucketNum: number | null = null;

    if (cand == null) {
      bucketNum = null;
    } else if (typeof cand === "number") {
      bucketNum = Number.isFinite(cand) ? (cand as number) : null;
    } else if (typeof cand === "string") {
      const t = Date.parse(cand);
      bucketNum = Number.isFinite(t) ? t : null;
    } else if (cand instanceof Date) {
      bucketNum = cand.getTime();
    } else {
      bucketNum = null;
    }
    out.bucket = bucketNum;

    // 일사량 필드 정규화: solar or solar_irradiance_wm2
    const s = out.solar ?? out.solar_irradiance_wm2 ?? null;
    out.solar = s == null ? null : (typeof s === "number" ? s : Number(s));

    // device_id 숫자화
    out.device_id = out.device_id == null ? null : Number(out.device_id);

    return out;
  });
}
