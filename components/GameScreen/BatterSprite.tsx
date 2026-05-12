'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './BatterSprite.module.scss';

// 12-frame sprite sheet (2×6 grid):
// Row 0 (0-5): idle → stance → lift → wind → wind_peak → stride
// Row 1 (6-11): load → contact → post_contact → follow_through → strikeout → homerun
const FRAMES = {
  IDLE: 0,
  STANCE: 1,
  LIFT: 2,
  WIND: 3,
  WIND_PEAK: 4,
  STRIDE: 5,
  LOAD: 6,
  CONTACT: 7,
  POST_CONTACT: 8,
  FOLLOW_THROUGH: 9,
  STRIKEOUT: 10,
  HOMERUN: 11,
} as const;

// Swing motion frames in order (10 frames over ~400ms)
const SWING_SEQUENCE = [
  FRAMES.STANCE,
  FRAMES.LIFT,
  FRAMES.WIND,
  FRAMES.WIND_PEAK,
  FRAMES.STRIDE,
  FRAMES.LOAD,
  FRAMES.CONTACT,
  FRAMES.POST_CONTACT,
  FRAMES.FOLLOW_THROUGH,
];
const FRAME_DURATION_MS = 45; // 9 frames × 45ms = 405ms swing

export function BatterSprite() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);
  const [frame, setFrame] = useState<number>(FRAMES.IDLE);

  useEffect(() => {
    if (phase === 'playing' || phase === 'title' || phase === 'intro') {
      setFrame(FRAMES.IDLE);
      return;
    }

    if (phase === 'judging' && lastResult) {
      // Play through swing sequence, then settle on final pose
      const timers: ReturnType<typeof setTimeout>[] = [];
      SWING_SEQUENCE.forEach((f, i) => {
        timers.push(setTimeout(() => setFrame(f), i * FRAME_DURATION_MS));
      });
      // Final pose based on outcome
      timers.push(
        setTimeout(() => {
          if (lastResult === 'homerun') setFrame(FRAMES.HOMERUN);
          else if (lastResult === 'strike') setFrame(FRAMES.STRIKEOUT);
          // hit: stay on FOLLOW_THROUGH
        }, SWING_SEQUENCE.length * FRAME_DURATION_MS)
      );
      return () => timers.forEach(clearTimeout);
    }

    if (phase === 'cutscene' && lastResult === 'homerun') {
      setFrame(FRAMES.HOMERUN);
    }
  }, [phase, lastResult]);

  return <div className={`${styles.sprite} ${styles[`frame-${frame}`]}`} aria-hidden />;
}
