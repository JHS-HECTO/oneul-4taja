'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './BatterSprite.module.scss';

// 12 frames: batter-01.png ~ batter-12.png
// 1 IDLE, 2 STANCE, 3 LOAD, 4 WIND_HALF, 5 WIND_PEAK, 6 STRIDE,
// 7 DOWNSWING, 8 CONTACT, 9 POST_CONTACT, 10 FOLLOW_THROUGH,
// 11 HOMERUN_POSE, 12 STRIKEOUT_POSE

// Swing sequence: frames 2→3→4→5→6→7→8→9→10 over 720ms (~80ms each)
const SWING_FRAME_SEQUENCE = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const SWING_FRAME_MS = 80; // 9 frames × 80ms = 720ms total
// CONTACT (frame 8) is 7th in sequence (index 6) → at 6 × 80ms = 480ms into swing

// Timing relative to phase=judging start:
const BATTER_SWING_START_MS = 720; // start swing 720ms after gauge stops
                                    // so contact (480ms into swing) happens at 1200ms
                                    // (matching ball arrival time)

export function BatterSprite() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);
  const [frame, setFrame] = useState<number>(1); // IDLE

  useEffect(() => {
    if (phase === 'playing' || phase === 'title' || phase === 'intro') {
      setFrame(1); // IDLE
      return;
    }

    if (phase === 'judging' && lastResult) {
      // Play swing sequence starting at BATTER_SWING_START_MS
      const timers: ReturnType<typeof setTimeout>[] = [];

      SWING_FRAME_SEQUENCE.forEach((frameNum, i) => {
        timers.push(
          setTimeout(() => setFrame(frameNum), BATTER_SWING_START_MS + i * SWING_FRAME_MS)
        );
      });

      // After swing, settle on final outcome pose
      const finalDelay = BATTER_SWING_START_MS + SWING_FRAME_SEQUENCE.length * SWING_FRAME_MS;
      timers.push(
        setTimeout(() => {
          if (lastResult === 'homerun') setFrame(11);
          else if (lastResult === 'strike') setFrame(12);
          // hit: stays on frame 10 (FOLLOW_THROUGH)
        }, finalDelay)
      );

      return () => timers.forEach(clearTimeout);
    }

    if (phase === 'cutscene' && lastResult === 'homerun') {
      setFrame(11);
    }
  }, [phase, lastResult]);

  const frameStr = String(frame).padStart(2, '0');
  return (
    <img
      src={`/images/batter-${frameStr}.png`}
      alt=""
      className={styles.sprite}
      aria-hidden
    />
  );
}
