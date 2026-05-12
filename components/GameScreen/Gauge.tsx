'use client';
import { useCallback } from 'react';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { useGauge } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const diff = getDifficulty(round);
  const running = phase === 'playing';

  const handleStop = useCallback(
    (position: number) => {
      const result = detectHit(position, diff);
      recordPitchResult(result);
    },
    [diff, recordPitchResult]
  );

  const { frame, stop } = useGauge({
    gaugeSpeedMs: diff.gaugeSpeedMs,
    running,
    onStop: handleStop,
  });

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
        onClick={stop}
        onTouchStart={(e) => {
          e.preventDefault();
          stop();
        }}
        disabled={!running}
        aria-label="탭해서 스윙"
      >
        <div className={styles.gauge}>
          <div className={styles.good} style={{ left: `${goodLeftStartPct}%`, width: `${goodWidthPct}%` }} />
          <div className={styles.perfect} style={{ left: `${perfectStartPct}%`, width: `${perfectWidthPct}%` }} />
          <div className={styles.good} style={{ left: `${goodRightStartPct}%`, width: `${goodWidthPct}%` }} />
          <div className={styles.indicator} style={{ left: `${frame.position * 100}%` }} />
        </div>
        <div className={styles.tapLabel}>▼ TAP TO SWING ▼</div>
      </button>
    </div>
  );
}
