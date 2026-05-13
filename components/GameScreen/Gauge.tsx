'use client';
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { useGauge } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const pitchIndex = useGameStore((s) => s.current.pitchIndex);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const [isPressing, setIsPressing] = useState(false);
  const diff = getDifficulty(round);

  const handleStop = useCallback(
    (position: number) => {
      const result = detectHit(position, diff);
      recordPitchResult(result);
    },
    [diff, recordPitchResult]
  );

  const running = isPressing && phase === 'playing';

  const { frame, stop, reset } = useGauge({
    gaugeSpeedMs: diff.gaugeSpeedMs,
    running,
    onStop: handleStop,
  });

  // Reset to centered preview when entering a new pitch
  useEffect(() => {
    if (phase === 'playing' && !isPressing) {
      reset();
    }
  }, [phase, round, pitchIndex, isPressing, reset]);

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
      stop();
    },
    [isPressing, stop]
  );

  if (phase !== 'playing' && phase !== 'judging') return null;

  const perfectWidthPct = diff.perfectZoneRatio * 100;
  const goodWidthPct = diff.goodZoneRatio * 100;

  // Always use frame.position — no snap to center on stop.
  // Initial frame state is 0.5 (center preview), changes on press, stays where stopped.
  const centerPct = frame.position * 100;
  const perfectLeft = centerPct - perfectWidthPct / 2;
  const goodLeftStart = perfectLeft - goodWidthPct;
  const goodRightStart = perfectLeft + perfectWidthPct;

  return (
    <div className={styles.gaugeWrap}>
      <div className={styles.gauge}>
        {/* Moving zones */}
        <div className={styles.good} style={{ left: `${goodLeftStart}%`, width: `${goodWidthPct}%` }} />
        <div className={styles.perfect} style={{ left: `${perfectLeft}%`, width: `${perfectWidthPct}%` }} />
        <div className={styles.good} style={{ left: `${goodRightStart}%`, width: `${goodWidthPct}%` }} />
        {/* Static center cursor */}
        <div className={styles.cursor} />
        <div className={styles.cursorArrow} aria-hidden />
      </div>

      {/* Round press-and-hold button */}
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
            {isPressing ? '떼!' : 'PUSH'}
          </span>
        </button>
      </div>
    </div>
  );
}
