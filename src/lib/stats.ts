/**
 * 통계 계산 유틸리티 함수
 */

/**
 * 평균 계산
 */
export function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
}

/**
 * 최댓값 계산
 */
export function calculateMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
}

/**
 * 최솟값 계산
 */
export function calculateMin(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
}

/**
 * 합계 계산
 */
export function calculateSum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
}

/**
 * 데이터 배열에서 특정 키의 통계 계산
 */
export function calculateStats(data: any[], key: string) {
    const values = data
        .map((item) => Number(item[key]))
        .filter((val) => !isNaN(val) && isFinite(val));

    return {
        avg: calculateAverage(values),
        max: calculateMax(values),
        min: calculateMin(values),
        sum: calculateSum(values),
        count: values.length,
    };
}
