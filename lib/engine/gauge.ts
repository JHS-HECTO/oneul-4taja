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

const CENTER_FRAME: GaugeFrame = { position: 0.5, direction: 1 };

/**
 * useGauge — running=true 동안 매 프레임 위치 업데이트.
 * 누르기 시작할 때 phase 보정으로 첫 프레임이 위치 0.5(중앙)부터 출발 → "프리뷰 중앙"에서
 * 자연스럽게 시작. 정지(stop) 후 프레임은 정지 위치 그대로 유지 (시각=판정 일치).
 * reset()으로 다음 투구 시작 시 중앙(0.5) 프리뷰 상태로 복원.
 */
export function useGauge(opts: {
  gaugeSpeedMs: number;
  running: boolean;
  onStop?: (position: number) => void;
}) {
  const { gaugeSpeedMs, running, onStop } = opts;
  const [frame, setFrame] = useState<GaugeFrame>(CENTER_FRAME);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef<GaugeFrame>(CENTER_FRAME);

  useEffect(() => {
    if (!running) return;
    // Phase shift so first frame at position 0.5 going right (smooth start from preview)
    startedAtRef.current = performance.now() - gaugeSpeedMs / 2;
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
    // Don't reset frame state — keep it at the captured position so visual stays put
    if (onStop) onStop(frameRef.current.position);
  }, [onStop]);

  const reset = useCallback(() => {
    setFrame(CENTER_FRAME);
    frameRef.current = CENTER_FRAME;
  }, []);

  return { frame, stop, reset };
}
