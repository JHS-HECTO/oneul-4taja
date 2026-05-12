'use client';
import styles from './Result.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Result() {
  const maxRound = useGameStore((s) => s.maxRoundReached);
  const score = useGameStore((s) => s.totalScore);
  const hits = useGameStore((s) => s.totalHits);
  const homeruns = useGameStore((s) => s.totalHomeruns);
  const goToTitle = useGameStore((s) => s.goToTitle);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);

  return (
    <div className={styles.result}>
      <img src="/images/gameover.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h2 className={styles.heading}>오늘의 기록</h2>
        <dl className={styles.stats}>
          <div className={styles.row}><dt>최고 회</dt><dd className={styles.big}>{maxRound}회</dd></div>
          <div className={styles.row}><dt>총 점수</dt><dd>{score.toLocaleString()}</dd></div>
          <div className={styles.row}><dt>안타</dt><dd>{hits}</dd></div>
          <div className={styles.row}><dt>홈런</dt><dd>{homeruns}</dd></div>
        </dl>
        <button type="button" className={styles.button} onClick={showLeaderboard}>
          리더보드 보기
        </button>
        <button type="button" className={styles.buttonSecondary} onClick={goToTitle}>
          처음으로
        </button>
      </div>
    </div>
  );
}
