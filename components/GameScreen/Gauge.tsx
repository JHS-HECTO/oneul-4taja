'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { computeGaugePosition } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

// 홈런·안타 존이 각자의 속도로 독립 진동하는 dual gauge.
// 각 첫 프레임이 위치 0.5(중앙)에서 시작하도록 phase shift.

const CENTER = 0.5;

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const pitchIndex = useGameStore((s) => s.current.pitchIndex);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const [isPressing, setIsPressing] = useState(false);
  const [homerunPos, setHomerunPos] = useState(CENTER);
  const [hitPos, setHitPos] = useState(CENTER);
  const homerunRef = useRef(CENTER);
  const hitRef = useRef(CENTER);
  const rafRef = useRef<number | null>(null);

  const diff = getDifficulty(round);
  const running = isPressing && phase === 'playing';

  // 두 oscillator 동시 진동 (단일 rAF 루프)
  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      // phase shift so each first frame is at position 0.5
      const hr = computeGaugePosition(elapsed + diff.homerunSpeedMs / 2, diff.homerunSpeedMs);
      const ht = computeGaugePosition(elapsed + diff.hitSpeedMs / 2, diff.hitSpeedMs);
      homerunRef.current = hr.position;
      hitRef.current = ht.position;
      setHomerunPos(hr.position);
      setHitPos(ht.position);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, diff.homerunSpeedMs, diff.hitSpeedMs]);

  // 새 투구 시작 시 중앙 프리뷰로 복원
  useEffect(() => {
    if (phase === 'playing' && !isPressing) {
      setHomerunPos(CENTER);
      setHitPos(CENTER);
      homerunRef.current = CENTER;
      hitRef.current = CENTER;
    }
  }, [phase, round, pitchIndex, isPressing]);

  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (phase !== 'playing') return;
      setIsPressing(true);
    },
    [phase]
  );

  const handlePressEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isPressing) return;
      setIsPressing(false);
      const result = detectHit(homerunRef.current, hitRef.current, diff);
      recordPitchResult(result);
    },
    [isPressing, diff, recordPitchResult]
  );

  if (phase !== 'playing' && phase !== 'judging') return null;

  const perfectWidthPct = diff.perfectZoneRatio * 100;
  const hitWidthPct = diff.hitZoneRatio * 100;

  // Each zone centered at its own position
  const perfectLeft = homerunPos * 100 - perfectWidthPct / 2;
  const hitLeft = hitPos * 100 - hitWidthPct / 2;

  return (
    <div className={styles.gaugeWrap}>
      {/* 안타 게이지 (더 굵고 느리게) */}
      <div className={clsx(styles.gauge, styles.hitGauge)}>
        <div className={styles.hitZone} style={{ left: `${hitLeft}%`, width: `${hitWidthPct}%` }} />
        <div className={styles.cursor} />
      </div>

      {/* 홈런 게이지 (얇고 빠르게) */}
      <div className={clsx(styles.gauge, styles.homerunGauge)}>
        <div className={styles.homerunZone} style={{ left: `${perfectLeft}%`, width: `${perfectWidthPct}%` }} />
        <div className={styles.cursor} />
        <div className={styles.cursorArrow} aria-hidden />
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          className={clsx(styles.roundButton, isPressing && styles.roundButtonPressing)}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          disabled={phase !== 'playing'}
          aria-label="누르고 있다가 떼서 스윙"
        >
          <span className={styles.buttonLabel}>
            {isPressing ? 'STOP' : 'PUSH'}
          </span>
        </button>
      </div>
    </div>
  );
}
