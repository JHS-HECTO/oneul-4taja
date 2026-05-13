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

  if (phase !== 'judging' || !lastResult || lastResult === 'strike') return null;

  if (lastResult === 'hit') {
    return (
      <div className={styles.impactWrap} aria-hidden>
        <div className={styles.hitRays} />
        <div className={styles.hitStar} />
        {SPARK_DIRECTIONS_HIT.map((angle) => (
          <Spark key={angle} angle={angle} className={styles.spark ?? ''} />
        ))}
      </div>
    );
  }

  // HOMERUN — full 7-layer composition
  return (
    <>
      <div className={styles.screenFlash} aria-hidden />
      <div className={styles.impactWrap} aria-hidden>
        {/* Layer 1: sunburst rays */}
        <div className={styles.hrRays} />
        {/* Layer 2: 3 staggered pulse rings */}
        <div className={`${styles.pulseRing} ${styles.pulseRing1}`} />
        <div className={`${styles.pulseRing} ${styles.pulseRing2}`} />
        <div className={`${styles.pulseRing} ${styles.pulseRing3}`} />
        {/* Layers 3-5: 3 counter-rotating stars */}
        <div className={styles.hrStarOuter} />
        <div className={styles.hrStarMid} />
        <div className={styles.hrStarInner} />
        {/* Layer 6: bright white core */}
        <div className={styles.hrCore} />
        {/* Layer 7: 8 sparks flying out */}
        {SPARK_DIRECTIONS_HR.map((angle) => (
          <Spark key={angle} angle={angle} className={styles.sparkBig ?? ''} />
        ))}
      </div>
    </>
  );
}
