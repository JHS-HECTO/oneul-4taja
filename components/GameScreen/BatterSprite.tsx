'use client';
import clsx from 'clsx';
import { useGameStore } from 'lib/store/gameStore';
import styles from './BatterSprite.module.scss';

type Frame = 'idle' | 'swing_wind' | 'swing_contact' | 'homerun' | 'strikeout';

export function BatterSprite() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);

  let frame: Frame = 'idle';
  if (phase === 'judging') {
    if (lastResult === 'homerun') frame = 'homerun';
    else if (lastResult === 'hit') frame = 'swing_contact';
    else if (lastResult === 'strike') frame = 'strikeout';
  } else if (phase === 'cutscene' && lastResult === 'homerun') {
    frame = 'homerun';
  }

  return <div className={clsx(styles.sprite, styles[frame])} aria-hidden />;
}
