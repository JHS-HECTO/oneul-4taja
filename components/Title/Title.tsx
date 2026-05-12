'use client';
import styles from './Title.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Title() {
  const startGame = useGameStore((s) => s.startGame);
  const freeLeft = useGameStore((s) => s.freeSessionsLeft);
  const adLeft = useGameStore((s) => s.adSessionsLeft);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const showDailyLimit = useGameStore((s) => s.showDailyLimit);

  const totalLeft = freeLeft + adLeft;

  const handleStart = () => {
    if (totalLeft === 0) {
      showDailyLimit();
      return;
    }
    startGame();
  };

  return (
    <div className={styles.title}>
      <img src="/images/title.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h1 className={styles.heading}>오늘의 4번타자</h1>
        <p className={styles.subtitle}>타이밍 맞춰 풀스윙!</p>
        <p className={styles.sessions}>
          오늘 남은 플레이: {totalLeft}회 (무료 {freeLeft} / 광고 {adLeft})
        </p>
        <button type="button" className={styles.startButton} onClick={handleStart}>
          {totalLeft === 0 ? '내일 다시!' : '게임 시작'}
        </button>
        <button type="button" className={styles.leaderboardButton} onClick={showLeaderboard}>
          리더보드
        </button>
      </div>
    </div>
  );
}
