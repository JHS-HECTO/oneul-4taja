'use client';
import clsx from 'clsx';
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
      {/* 상단 50%: 일러스트 + 하단 페이드 */}
      <div className={styles.imageZone}>
        <img src="/images/title.png" alt="" className={styles.bg} />
        <div className={styles.imageFade} aria-hidden />
      </div>

      {/* 하단 50%: 어두운 배경 + 정보/버튼 */}
      <div className={styles.infoZone}>
        {/* 타이틀 (박스 없이 큼직하게) */}
        <div className={styles.titleBlock}>
          <h1 className={styles.heading}>오늘의 4번타자</h1>
          <p className={styles.subtitle}>타이밍 맞춰 풀스윙!</p>
        </div>

        {/* 응모권 안내 배너 */}
        <div className={styles.ticketBanner}>
          <img src="/images/ticket.png" alt="" className={styles.ticketIcon} aria-hidden />
          <div className={styles.ticketText}>
            <span className={styles.ticketHeadline}>10회마다 응모권 지급!</span>
            <span className={styles.ticketSub}>10 / 20 / 30 / 40 / 50회 도달 시 지급</span>
          </div>
        </div>

        {/* 세션 정보 */}
        <div className={styles.sessions}>
          오늘 남은 플레이{' '}
          <span className={clsx(totalLeft > 0 && styles.sessionsHigh)}>{totalLeft}회</span>
          {' '}(무료 {freeLeft} / 광고 {adLeft})
        </div>

        {/* 버튼들 */}
        <div className={styles.buttons}>
          <button type="button" className={styles.startButton} onClick={handleStart}>
            {totalLeft === 0 ? '내일 다시!' : '게임 시작'}
          </button>
          <button type="button" className={styles.leaderboardButton} onClick={showLeaderboard}>
            리더보드
          </button>
        </div>
      </div>
    </div>
  );
}
