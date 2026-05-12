'use client';
import styles from './DailyLimit.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function DailyLimit() {
  const goToTitle = useGameStore((s) => s.goToTitle);
  return (
    <div className={styles.daily}>
      <img src="/images/gameover.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h2 className={styles.heading}>오늘은 여기까지!</h2>
        <p className={styles.body}>
          하루 5세션 모두 소진하셨습니다.<br />
          자정에 리셋됩니다.<br />
          내일 다시 도전!
        </p>
        <button type="button" className={styles.button} onClick={goToTitle}>
          확인
        </button>
      </div>
    </div>
  );
}
