'use client';
import { useGameStore } from 'lib/store/gameStore';
import {
  HITS_TO_CLEAR_ROUND,
  STRIKES_TO_GAME_OVER,
} from 'lib/constants';
import styles from './Hud.module.scss';

export function Hud() {
  const round = useGameStore((s) => s.current.round);
  const hits = useGameStore((s) => s.current.hits);
  const strikes = useGameStore((s) => s.totalStrikes);
  const score = useGameStore((s) => s.totalScore);

  return (
    <div className={styles.hud}>
      <div className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.label}>회</span>
          <span className={`${styles.value} ${styles.roundVal}`}>{round}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>안타</span>
          <span className={`${styles.value} ${styles.hitVal}`}>{hits}/{HITS_TO_CLEAR_ROUND}</span>
        </div>
      </div>
      <div className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.label}>점수</span>
          <span className={`${styles.value} ${styles.scoreVal}`}>{score.toLocaleString()}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>스트라이크</span>
          <span className={`${styles.value} ${styles.strikeVal}`}>{strikes}/{STRIKES_TO_GAME_OVER}</span>
        </div>
      </div>
    </div>
  );
}
