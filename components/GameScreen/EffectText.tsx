'use client';
import clsx from 'clsx';
import { useGameStore } from 'lib/store/gameStore';
import styles from './EffectText.module.scss';

const LABEL: Record<string, string> = {
  homerun: '★ HOMERUN ★',
  hit: '딱! 안타!',
  strike: '헛스윙!',
};

export function EffectText() {
  const phase = useGameStore((s) => s.phase);
  const last = useGameStore((s) => s.lastResult);
  if (phase !== 'judging' || !last) return null;
  return <div className={clsx(styles.effect, styles[last])}>{LABEL[last]}</div>;
}
