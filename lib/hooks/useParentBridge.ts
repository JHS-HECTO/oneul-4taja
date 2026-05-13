// 부모 폴리볼 ↔ 게임 통신 브릿지 hook.
// 게임 진입 시 GAME_READY emit → 부모가 USER_INFO 응답.
// AD_COMPLETED 받으면 startContinue 자동 실행.

import { useEffect } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import { emit, isEmbedded, setupPostMessageListener } from 'lib/postMessage';

export function useParentBridge() {
  const setUser = useGameStore((s) => s.setUser);
  const setSessionCounters = useGameStore((s) => s.setSessionCounters);
  const startContinue = useGameStore((s) => s.startContinue);

  useEffect(() => {
    const cleanup = setupPostMessageListener({
      onUserInfo: (msg) => {
        setUser({ nickname: msg.nickname, team: msg.team });
        setSessionCounters(msg.free_left, msg.ad_left);
        // (응모권 마일스톤/평생 50회 플래그는 zustand 직접 주입)
        useGameStore.setState({
          dailyMilestonesDone: msg.daily_milestones_done ?? [],
          lifetime50Done: msg.lifetime_50_done ?? false,
        });
      },
      onAdCompleted: () => {
        // 광고 시청 완료 → 이어하기 진행
        startContinue();
      },
      onAdFailed: (reason) => {
        // 광고 실패 시 별도 처리 없음 (ContinueModal에 머묾)
        // 향후 토스트/메시지 표시 가능
        console.warn('[CLEANUP] Ad failed:', reason);
      },
    });

    // 게임 진입 시 부모에 READY 통지
    emit({ type: 'CLEANUP:GAME_READY' });

    return cleanup;
  }, [setUser, setSessionCounters, startContinue]);

  return { isEmbedded: isEmbedded() };
}
