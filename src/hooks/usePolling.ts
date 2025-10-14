// src/hooks/usePolling.ts
/**
 * 간단 폴링 훅: 주기적으로 async 함수를 호출.
 * - component unmount 시 안전 종료.
 */
import { useEffect } from 'react';

export function usePolling(fn: () => Promise<void>, ms: number) {
    useEffect(() => {
        let on = true;
        const tick = async () => { if (!on) return; await fn(); };
        tick();
        const id = setInterval(tick, ms);
        return () => { on = false; clearInterval(id); };
    }, [fn, ms]);
}
