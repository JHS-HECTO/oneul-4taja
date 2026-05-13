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

  // 새 투구 시작 시 중앙 프리뷰로 복원
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

  // 존이 움직이는 디자인 (커서는 가운데 고정)
  const centerPct = frame.position * 100;
  const perfectLeft = centerPct - perfectWidthPct / 2;
  const goodLeftStart = perfectLeft - goodWidthPct;
  const goodRightStart = perfectLeft + perfectWidthPct;

  return (
    <div className={styles.gaugeWrap}>
      <div className={styles.gauge}>
        {/* 움직이는 존: 안타-홈런-안타 (양옆 안타 + 가운데 홈런) */}
        <div className={styles.good} style={{ left: `${goodLeftStart}%`, width: `${goodWidthPct}%` }} />
        <div className={styles.perfect} style={{ left: `${perfectLeft}%`, width: `${perfectWidthPct}%` }} />
        <div className={styles.good} style={{ left: `${goodRightStart}%`, width: `${goodWidthPct}%` }} />
        {/* 정중앙 고정 커서 */}
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
