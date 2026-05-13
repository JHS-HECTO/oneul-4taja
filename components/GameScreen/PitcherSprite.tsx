'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './PitcherSprite.module.scss';

// 6 frames: pitcher-01.png ~ pitcher-06.png
// 1 STANCE, 2 SET, 3 KNEE_LIFT, 4 KNEE_PEAK, 5 STRIDE, 6 ARM_BACK (release pose)

const PITCH_FRAME_SEQUENCE = [1, 2, 3, 4, 5, 6] as const;
const PITCH_FRAME_MS = 117; // 6 × 117ms ≈ 700ms total wind-up

// Pitcher animates during judging phase from T=0 to T=700ms
// After T=700ms, holds on frame 6 (release pose) until phase changes

export function PitcherSprite() {
  const phase = useGameStore((s) => s.phase);
  const [frame, setFrame] = useState<number>(1);

  useEffect(() => {
    // Reset to STANCE when playing/title
    if (phase === 'playing' || phase === 'title' || phase === 'intro') {
      setFrame(1);
      return;
    }

    if (phase === 'judging') {
      const timers: ReturnType<typeof setTimeout>[] = [];
      PITCH_FRAME_SEQUENCE.forEach((frameNum, i) => {
        timers.push(setTimeout(() => setFrame(frameNum), i * PITCH_FRAME_MS));
      });
      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  if (phase !== 'playing' && phase !== 'judging') return null;

  const frameStr = String(frame).padStart(2, '0');
  return (
    <img
      src={`/images/pitcher-${frameStr}.png`}
      alt=""
      className={styles.sprite}
      aria-hidden
    />
  );
}
