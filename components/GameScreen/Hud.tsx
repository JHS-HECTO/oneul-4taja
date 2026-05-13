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
      {/* 좌: 회차 + 점수 (게임 진행 통계) */}
      <div className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.label}>회</span>
          <span className={`${styles.value} ${styles.roundVal}`}>{round}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>점수</span>
          <span className={`${styles.value} ${styles.scoreVal}`}>{score.toLocaleString()}</span>
        </div>
      </div>

      {/* 우: 안타 + 스트라이크 (현재 회 상태) */}
      <div className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.label}>안타</span>
          <span className={`${styles.value} ${styles.hitVal}`}>{hits}/{HITS_TO_CLEAR_ROUND}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>아웃</span>
          <span className={`${styles.value} ${styles.strikeVal}`}>{strikes}/{STRIKES_TO_GAME_OVER}</span>
        </div>
      </div>
    </div>
  );
}
