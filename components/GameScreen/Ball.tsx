'use client';
import clsx from 'clsx';
import styles from './Ball.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Ball() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);
  // Ball only visible during judging, and animation depends on outcome
  if (phase !== 'judging' || !lastResult) return null;
  return <div className={clsx(styles.ball, styles[lastResult])} aria-hidden />;
}
