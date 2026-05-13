'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './ImpactEffect.module.scss';

export function ImpactEffect() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);

  // Only render during judging
  if (phase !== 'judging' || !lastResult) return null;

  if (lastResult === 'strike') {
    // No impact for missed swings — ball just passes through
    return null;
  }

  if (lastResult === 'hit') {
    return (
      <div className={styles.impactWrap} aria-hidden>
        <div className={styles.hit} />
      </div>
    );
  }

  // HOMERUN — full flashy treatment
  return (
    <>
      <div className={styles.screenFlash} aria-hidden />
      <div className={styles.impactWrap} aria-hidden>
        <div className={styles.homerunRays} />
        <div className={styles.homerunBurst} />
      </div>
    </>
  );
}
