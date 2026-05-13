'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './RewardPopup.module.scss';

export function RewardPopup() {
  const pendingReward = useGameStore((s) => s.pendingReward);
  const dismissReward = useGameStore((s) => s.dismissReward);

  if (!pendingReward) return null;

  return (
    <div className={styles.overlay} onClick={dismissReward} role="dialog" aria-modal="true">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <img className={styles.icon} src="/images/ticket.png" alt="응모권" />
        <div className={styles.title}>
          <span className={styles.red}>{pendingReward.round}회</span> 달성!
        </div>
        <div className={styles.countRow}>
          <span className={styles.num}>{pendingReward.count}</span>
          <span className={styles.unit}>장</span>
        </div>
        <div className={styles.desc}>응모권을 획득했어요</div>
        <button type="button" className={styles.confirmBtn} onClick={dismissReward}>
          확인
        </button>
      </div>
    </div>
  );
}
