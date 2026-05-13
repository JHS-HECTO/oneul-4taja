'use client';
import { useCallback, useState } from 'react';
import clsx from 'clsx';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { useGauge } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const [running, setRunning] = useState(false);
  const diff = getDifficulty(round);

  const handleStop = useCallback(
    (position: number) => {
      const result = detectHit(position, diff);
      recordPitchResult(result);
      setRunning(false);
    },
    [diff, recordPitchResult]
  );

  const { frame, stop } = useGauge({
    gaugeSpeedMs: diff.gaugeSpeedMs,
    running: running && phase === 'playing',
    onStop: handleStop,
  });

  const handleTap = useCallback(() => {
    if (phase !== 'playing') return;
    if (running) {
      stop();
    } else {
      setRunning(true);
    }
  }, [phase, running, stop]);

  if (phase !== 'playing' && phase !== 'judging') return null;

  const perfectWidthPct = diff.perfectZoneRatio * 100;
  const goodWidthPct = diff.goodZoneRatio * 100;

  // Zones move with `frame.position`. Cursor stays static at 50%.
  // When position = 0.5, perfect zone centered under cursor → homerun.
  // When idle (not running), zones held at 0.5 (centered preview).
  const center = running ? frame.position * 100 : 50;
  const perfectLeft = center - perfectWidthPct / 2;
  const goodLeftStart = perfectLeft - goodWidthPct;
  const goodRightStart = perfectLeft + perfectWidthPct;

  const buttonLabel = phase === 'judging'
    ? '…'
    : running
      ? '지금 멈춰!'
      : '눌러서 시작하기';

  return (
    <div className={styles.gaugeWrap}>
      <div className={styles.gaugeArea}>
        <div className={styles.gauge}>
          {/* Moving zones */}
          <div className={styles.good} style={{ left: `${goodLeftStart}%`, width: `${goodWidthPct}%` }} />
          <div className={styles.perfect} style={{ left: `${perfectLeft}%`, width: `${perfectWidthPct}%` }} />
          <div className={styles.good} style={{ left: `${goodRightStart}%`, width: `${goodWidthPct}%` }} />
          {/* Static center cursor */}
          <div className={styles.cursor} />
          <div className={styles.cursorArrow} aria-hidden />
        </div>
      </div>

      <button
        type="button"
        className={clsx(styles.actionButton, running && styles.actionButtonRunning)}
        onClick={handleTap}
        disabled={phase !== 'playing'}
        aria-label={buttonLabel}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
