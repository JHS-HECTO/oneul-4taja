import { useEffect, useRef, useState, useCallback } from 'react';
import type { GaugeFrame, GaugeEasing } from 'lib/types';

/**
 * 시간(ms) 기반 게이지 위치 계산. 좌→우→좌 = 1 사이클 = gaugeSpeedMs × 2.
 *
 * easing 'linear': 삼각파(균일 속도)
 * easing 'easeInOut': 가장자리에서 천천히, 중앙에서 빠르게 (cubic ease-in-out)
 *   — 좌·우 끝에서 잠깐 멈추는 듯, 가운데를 휙 통과하는 느낌
 */
export function computeGaugePosition(
  elapsedMs: number,
  gaugeSpeedMs: number,
  easing: GaugeEasing = 'linear'
): GaugeFrame {
  const cycleMs = gaugeSpeedMs * 2;
  const t = (elapsedMs % cycleMs) / cycleMs; // 0..1 within full cycle

  if (easing === 'linear') {
    if (t < 0.5) {
      return { position: t * 2, direction: 1 };
    } else {
      return { position: 2 - t * 2, direction: -1 };
    }
  }

  // easeInOut: cubic ease-in-out on each half (sweep)
  if (t < 0.5) {
    const u = t * 2; // 0..1 left-to-right
    const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return { position: eased, direction: 1 };
  } else {
    const u = (t - 0.5) * 2; // 0..1 right-to-left
    const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return { position: 1 - eased, direction: -1 };
  }
}

const CENTER_FRAME: GaugeFrame = { position: 0.5, direction: 1 };

/**
 * useGauge — running=true 동안 매 프레임 위치 업데이트.
 * easing 파라미터에 따라 균일/완급 진동 선택.
 */
export function useGauge(opts: {
  gaugeSpeedMs: number;
  easing?: GaugeEasing;
  running: boolean;
  onStop?: (position: number) => void;
}) {
  const { gaugeSpeedMs, easing = 'linear', running, onStop } = opts;
  const [frame, setFrame] = useState<GaugeFrame>(CENTER_FRAME);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef<GaugeFrame>(CENTER_FRAME);

  useEffect(() => {
    if (!running) return;
    // Phase shift so first frame at position 0.5 going right (smooth from preview)
    startedAtRef.current = performance.now() - gaugeSpeedMs / 2;
    const tick = (now: number) => {
      const elapsed = now - (startedAtRef.current ?? now);
      const f = computeGaugePosition(elapsed, gaugeSpeedMs, easing);
      frameRef.current = f;
      setFrame(f);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, gaugeSpeedMs, easing]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (onStop) onStop(frameRef.current.position);
  }, [onStop]);

  const reset = useCallback(() => {
    setFrame(CENTER_FRAME);
    frameRef.current = CENTER_FRAME;
  }, []);

  return { frame, stop, reset };
}
