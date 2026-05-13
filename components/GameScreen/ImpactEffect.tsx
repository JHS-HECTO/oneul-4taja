'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './ImpactEffect.module.scss';

const SPARK_DIRECTIONS_HIT = [0, 90, 180, 270];
const SPARK_DIRECTIONS_HR = [0, 45, 90, 135, 180, 225, 270, 315];

type SparkProps = { angle: number; className: string };
function Spark({ angle, className }: SparkProps) {
  return (
    <div
      className={className}
      style={{ ['--angle' as string]: `${angle}deg` } as React.CSSProperties}
    />
  );
}

export function ImpactEffect() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);

  // No effect during non-judging or miss
  if (phase !== 'judging' || !lastResult || lastResult === 'strike') return null;

  if (lastResult === 'hit') {
    return (
      <div className={styles.impactWrap} aria-hidden>
        <div className={styles.hitStar} />
        {SPARK_DIRECTIONS_HIT.map((angle) => (
          <Spark key={angle} angle={angle} className={styles.spark ?? ''} />
        ))}
      </div>
    );
  }

  // HOMERUN — layered burst + shockwave + sparks + 꽝! text + screen flash
  return (
    <>
      <div className={styles.screenFlash} aria-hidden />
      <div className={styles.impactWrap} aria-hidden>
        <div className={styles.shockwave} />
        <div className={styles.hrStarOuter} />
        <div className={styles.hrStarInner} />
        <div className={styles.hrText}>꽝!</div>
        {SPARK_DIRECTIONS_HR.map((angle) => (
          <Spark key={angle} angle={angle} className={styles.sparkBig ?? ''} />
        ))}
      </div>
    </>
  );
}
