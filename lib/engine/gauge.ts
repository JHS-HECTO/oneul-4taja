import { useEffect, useRef, useState, useCallback } from 'react';
import type { GaugeFrame } from 'lib/types';

/**
 * 시간(ms) 기반 게이지 위치 계산. 좌→우→좌 = 1 사이클 = gaugeSpeedMs × 2.
 * 위치는 0..1 사이의 삼각파.
 */
export function computeGaugePosition(elapsedMs: number, gaugeSpeedMs: number): GaugeFrame {
  const cycleMs = gaugeSpeedMs * 2;
  const t = (elapsedMs % cycleMs) / cycleMs; // 0..1
  if (t < 0.5) {
    return { position: t * 2, direction: 1 };
  } else {
    return { position: 2 - t * 2, direction: -1 };
  }
}

/**
 * useGauge — running=true 동안 매 프레임 위치 업데이트.
 * stop()으로 정지하면 onStop 콜백에 현재 위치를 전달.
 */
export function useGauge(opts: {
  gaugeSpeedMs: number;
  running: boolean;
  onStop?: (position: number) => void;
}) {
  const { gaugeSpeedMs, running, onStop } = opts;
  const [frame, setFrame] = useState<GaugeFrame>({ position: 0, direction: 1 });
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef<GaugeFrame>({ position: 0, direction: 1 });

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - (startedAtRef.current ?? now);
      const f = computeGaugePosition(elapsed, gaugeSpeedMs);
      frameRef.current = f;
      setFrame(f);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, gaugeSpeedMs]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (onStop) onStop(frameRef.current.position);
  }, [onStop]);

  return { frame, stop };
}
