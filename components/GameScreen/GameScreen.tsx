'use client';
import { useEffect } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import { JUDGING_DELAY_MS } from 'lib/constants';
import styles from './GameScreen.module.scss';
import { Hud } from './Hud';
import { BatterSprite } from './BatterSprite';
import { Ball } from './Ball';
import { Gauge } from './Gauge';

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const proceedAfterJudging = useGameStore((s) => s.proceedAfterJudging);

  useEffect(() => {
    if (phase !== 'judging') return;
    const t = setTimeout(() => proceedAfterJudging(), JUDGING_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, proceedAfterJudging]);

  return (
    <div className={styles.screen}>
      <div className={styles.background} aria-hidden />
      <Hud />
      <BatterSprite />
      <Ball />
      <Gauge />
    </div>
  );
}
