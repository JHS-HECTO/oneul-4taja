'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useGameStore } from 'lib/store/gameStore';
import styles from './BatterSprite.module.scss';

type Frame = 'idle' | 'swing_wind' | 'swing_contact' | 'homerun' | 'strikeout';

// 스윙 시퀀스 타이밍 (총 judging 800ms 안에 들어가야 함)
const SWING_WIND_MS = 90;      // 0-90ms: 백스윙
const SWING_CONTACT_MS = 110;  // 90-200ms: 임팩트
// 200-800ms: 최종 포즈 (homerun/strikeout/swing_contact 유지)

export function BatterSprite() {
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);

  const [frame, setFrame] = useState<Frame>('idle');

  useEffect(() => {
    // 게임 진행 중이면 idle, 그 외 결과 진입 시 시퀀스 실행
    if (phase === 'playing' || phase === 'title' || phase === 'intro') {
      setFrame('idle');
      return;
    }

    if (phase === 'judging' && lastResult) {
      // 1) 백스윙
      setFrame('swing_wind');
      const t1 = setTimeout(() => {
        // 2) 임팩트
        setFrame('swing_contact');
        const t2 = setTimeout(() => {
          // 3) 최종 포즈
          if (lastResult === 'homerun') setFrame('homerun');
          else if (lastResult === 'strike') setFrame('strikeout');
          // hit 의 경우 swing_contact 유지
        }, SWING_CONTACT_MS);
        return () => clearTimeout(t2);
      }, SWING_WIND_MS);
      return () => clearTimeout(t1);
    }

    // cutscene/result/leaderboard 등: 직전 포즈 유지하지 않고 lastResult 기반 정적 표시
    if (phase === 'cutscene' && lastResult === 'homerun') {
      setFrame('homerun');
    }
  }, [phase, lastResult]);

  return <div className={clsx(styles.sprite, styles[frame])} aria-hidden />;
}
