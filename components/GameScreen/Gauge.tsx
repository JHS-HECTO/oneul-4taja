'use client';
import { useCallback, useState } from 'react';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { useGauge } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const [isPressing, setIsPressing] = useState(false);

  const diff = getDifficulty(round);

  const handleRelease = useCallback(
    (position: number) => {
      const result = detectHit(position, diff);
      recordPitchResult(result);
    },
    [diff, recordPitchResult]
  );

  // Gauge runs only while pressing AND in playing phase
  const running = isPressing && phase === 'playing';

  const { frame, stop } = useGauge({
    gaugeSpeedMs: diff.gaugeSpeedMs,
    running,
    onStop: handleRelease,
  });

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
  const perfectStartPct = 50 - perfectWidthPct / 2;
  const goodWidthPct = diff.goodZoneRatio * 100;
  const goodLeftStartPct = perfectStartPct - goodWidthPct;
  const goodRightStartPct = perfectStartPct + perfectWidthPct;

  return (
    <div className={styles.gaugeWrap}>
      <button
        type="button"
        className={styles.tapZone}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        disabled={phase !== 'playing'}
        aria-label="누르고 있다가 떼서 스윙"
      >
        <div className={styles.gauge}>
          <div className={styles.good} style={{ left: `${goodLeftStartPct}%`, width: `${goodWidthPct}%` }} />
          <div className={styles.perfect} style={{ left: `${perfectStartPct}%`, width: `${perfectWidthPct}%` }} />
          <div className={styles.good} style={{ left: `${goodRightStartPct}%`, width: `${goodWidthPct}%` }} />
          <div className={styles.indicator} style={{ left: `${frame.position * 100}%` }} />
        </div>
        <div className={styles.tapLabel}>
          {phase === 'judging' ? '   ' : isPressing ? '▼ 손 떼면 스윙! ▼' : '▼ 누르고 있어! ▼'}
        </div>
      </button>
    </div>
  );
}
