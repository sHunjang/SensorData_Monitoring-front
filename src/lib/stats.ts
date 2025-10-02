// src/lib/stats.ts
export type Stat = { avg: number | null; max: number | null; min: number | null; count: number };

export function calcStats(values: (number | null)[]): Stat {
    const nums = values.filter((v): v is number => v != null);
    if (nums.length === 0) {
        return { avg: null, max: null, min: null, count: 0 };
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
        avg: +(sum / nums.length).toFixed(3),
        max: Math.max(...nums),
        min: Math.min(...nums),
        count: nums.length,
    };
}
