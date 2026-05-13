'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './RoundTransition.module.scss';

const BANNER_DURATION_MS = 1500;

export function RoundTransition() {
  const round = useGameStore((s) => s.current.round);
  const phase = useGameStore((s) => s.phase);
  const [displayRound, setDisplayRound] = useState<number | null>(null);
  const prevRoundRef = useRef<number>(round);

  useEffect(() => {
    // Only fire while game is in 'playing'. During cutscene the round
    // may have already incremented but we wait for play to resume.
    if (phase !== 'playing') return;
    if (round !== prevRoundRef.current && round > 1) {
      setDisplayRound(round);
      const t = setTimeout(() => setDisplayRound(null), BANNER_DURATION_MS);
      prevRoundRef.current = round;
      return () => clearTimeout(t);
    }
    prevRoundRef.current = round;
  }, [round, phase]);

  if (displayRound === null) return null;

  return (
    <>
      {/* 어두운 오버레이 (회차마다 딤 처리) */}
      <div className={styles.overlay} aria-hidden />
      {/* 배너 + 서브 라벨 */}
      <div className={styles.banner} aria-hidden>
        <div className={styles.subLabel}>NEXT INNING</div>
        <div className={styles.text} key={displayRound}>{displayRound}회</div>
      </div>
    </>
  );
}
