'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './Hud.module.scss';

export function Hud() {
  const round = useGameStore((s) => s.current.round);
  const hits = useGameStore((s) => s.current.hits);
  const strikes = useGameStore((s) => s.totalStrikes);
  const score = useGameStore((s) => s.totalScore);

  return (
    <div className={styles.hud}>
      <div className={styles.row}>
        <span className={styles.round}>▶ {round}회</span>
        <span className={styles.score}>{score.toLocaleString()}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.hits}>안타 {hits}/3</span>
        <span className={styles.strikes}>아웃 {strikes}/3</span>
      </div>
    </div>
  );
}
