'use client';
import { useEffect } from 'react';
import clsx from 'clsx';
import { useGameStore } from 'lib/store/gameStore';
import styles from './GameScreen.module.scss';
import { Hud } from './Hud';
import { BatterSprite } from './BatterSprite';
import { PitcherSprite } from './PitcherSprite';
import { Ball } from './Ball';
import { Gauge } from './Gauge';
import { EffectText } from './EffectText';
import { ImpactEffect } from './ImpactEffect';
import { RoundTransition } from './RoundTransition';

const JUDGING_TOTAL_MS = 2000;

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);
  const proceedAfterJudging = useGameStore((s) => s.proceedAfterJudging);

  useEffect(() => {
    if (phase !== 'judging') return;
    const t = setTimeout(() => proceedAfterJudging(), JUDGING_TOTAL_MS);
    return () => clearTimeout(t);
  }, [phase, proceedAfterJudging]);

  // Homerun adds screen-shake on the whole screen container
  const screenClass = clsx(
    styles.screen,
    phase === 'judging' && lastResult === 'homerun' && styles.homerunShake
  );

  return (
    <div className={screenClass}>
      <div className={styles.background} aria-hidden />
      <Hud />
      <PitcherSprite />
      <Ball />
      <BatterSprite />
      <ImpactEffect />
      <Gauge />
      <EffectText />
      <RoundTransition />
    </div>
  );
}
