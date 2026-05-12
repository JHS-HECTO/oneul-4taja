'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './PitcherSprite.module.scss';

// 8-frame pitching motion: stance → set → leg_lift → knee_peak → stride → arm_cocked → release → follow_through
const TOTAL_FRAMES = 8;
const PITCH_FRAME_MS = 70; // 8 × 70 = 560ms full motion
const PITCH_CYCLE_MS = 1500; // 한 사이클 (피칭 모션 + 리셋 휴식)

export function PitcherSprite() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const pitchIndex = useGameStore((s) => s.current.pitchIndex);
  const [frame, setFrame] = useState<number>(0);
  const cycleStartRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'playing') {
      setFrame(0);
      return;
    }
    // Re-start motion at start of each pitch
    cycleStartRef.current = performance.now();
    setFrame(0);

    const interval = setInterval(() => {
      const elapsed = (performance.now() - cycleStartRef.current) % PITCH_CYCLE_MS;
      if (elapsed < PITCH_FRAME_MS * TOTAL_FRAMES) {
        const f = Math.floor(elapsed / PITCH_FRAME_MS);
        setFrame(Math.min(f, TOTAL_FRAMES - 1));
      } else {
        // After motion finishes, hold on frame 0 (stance) until next cycle
        setFrame(0);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [phase, round, pitchIndex]);

  if (phase !== 'playing' && phase !== 'judging') return null;

  return <div className={`${styles.sprite} ${styles[`frame-${frame}`]}`} aria-hidden />;
}
