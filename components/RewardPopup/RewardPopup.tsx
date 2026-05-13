'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './RewardPopup.module.scss';

// Defer popup briefly so the round transition banner has time to play out
// before the popup overlay covers the screen.
const POPUP_DEFER_MS = 1700;

export function RewardPopup() {
  const pendingReward = useGameStore((s) => s.pendingReward);
  const dismissReward = useGameStore((s) => s.dismissReward);
  const phase = useGameStore((s) => s.phase);

  const [readyToShow, setReadyToShow] = useState(false);

  useEffect(() => {
    if (!pendingReward) {
      setReadyToShow(false);
      return;
    }
    if (phase !== 'playing') {
      setReadyToShow(false);
      return;
    }
    // pendingReward set and phase is playing — defer briefly for round banner
    const t = setTimeout(() => setReadyToShow(true), POPUP_DEFER_MS);
    return () => clearTimeout(t);
  }, [pendingReward, phase]);

  if (!pendingReward || phase !== 'playing' || !readyToShow) return null;

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
