'use client';
import styles from './Ball.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Ball() {
  const phase = useGameStore((s) => s.phase);
  if (phase !== 'playing') return null;
  return <div className={styles.ball} aria-hidden />;
}
