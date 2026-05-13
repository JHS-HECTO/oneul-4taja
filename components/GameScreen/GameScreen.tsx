'use client';
import { useEffect } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './GameScreen.module.scss';
import { Hud } from './Hud';
import { BatterSprite } from './BatterSprite';
import { PitcherSprite } from './PitcherSprite';
import { Ball } from './Ball';
import { Gauge } from './Gauge';
import { EffectText } from './EffectText';

// New flow timing (relative to phase=judging start):
// T=0     gauge stops, judging starts
// T=0-700 pitcher winds up (6 frames)
// T=700   pitcher releases ball
// T=700-1200 ball flies
// T=720-1440 batter swing (12 frames)
// T=1200  contact moment, effect text shows
// T=2000  proceed to next phase
const JUDGING_TOTAL_MS = 2000;

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const proceedAfterJudging = useGameStore((s) => s.proceedAfterJudging);

  useEffect(() => {
    if (phase !== 'judging') return;
    const t = setTimeout(() => proceedAfterJudging(), JUDGING_TOTAL_MS);
    return () => clearTimeout(t);
  }, [phase, proceedAfterJudging]);

  return (
    <div className={styles.screen}>
      <div className={styles.background} aria-hidden />
      <Hud />
      <PitcherSprite />
      <Ball />
      <BatterSprite />
      <Gauge />
      <EffectText />
    </div>
  );
}
