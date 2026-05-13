'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './RoundTransition.module.scss';

const BANNER_DURATION_MS = 1200;

export function RoundTransition() {
  const round = useGameStore((s) => s.current.round);
  const phase = useGameStore((s) => s.phase);
  const [displayRound, setDisplayRound] = useState<number | null>(null);
  const prevRoundRef = useRef<number>(round);

  useEffect(() => {
    // Show banner when round changes during playing (after round clear).
    // Skip the initial 1회 (game start) and only show when round actually advances.
    if (round !== prevRoundRef.current && round > 1 && phase === 'playing') {
      setDisplayRound(round);
      const t = setTimeout(() => setDisplayRound(null), BANNER_DURATION_MS);
      prevRoundRef.current = round;
      return () => clearTimeout(t);
    }
    prevRoundRef.current = round;
  }, [round, phase]);

  if (displayRound === null) return null;

  return (
    <div className={styles.banner} aria-hidden>
      <div className={styles.text} key={displayRound}>{displayRound}회</div>
    </div>
  );
}
