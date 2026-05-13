'use client';
import styles from './ContinueModal.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { emit, isEmbedded } from 'lib/postMessage';

export function ContinueModal() {
  const continuesLeft = useGameStore((s) => s.continuesLeft);
  const round = useGameStore((s) => s.current.round);
  const startContinue = useGameStore((s) => s.startContinue);
  const giveUp = useGameStore((s) => s.giveUp);

  const handleContinue = () => {
    if (isEmbedded()) {
      // 부모(폴리볼)에 광고 재생 요청 → AD_COMPLETED 받으면 자동으로 startContinue
      emit({ type: 'CLEANUP:PLAY_AD', reason: 'continue' });
    } else {
      // 단독 dev 환경: 광고 없이 즉시 이어하기
      startContinue();
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2 className={styles.heading}>한 번만 더?</h2>
        <p className={styles.body}>
          {round}회에서 멈추셨습니다.<br />
          광고를 보고 이 회부터 다시 시작할까요?
        </p>
        <p className={styles.continues}>이어하기 {continuesLeft}회 남음</p>
        <button type="button" className={styles.continueButton} onClick={handleContinue}>
          광고 보고 이어하기
        </button>
        <button type="button" className={styles.giveUpButton} onClick={giveUp}>
          오늘은 그만
        </button>
      </div>
    </div>
  );
}
