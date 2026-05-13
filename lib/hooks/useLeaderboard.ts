// 리더보드 데이터 로더 hook.
// 임베드 환경: 부모가 CLEANUP:LEADERBOARD_DATA 메시지로 응답 → 그 값 사용.
// 단독 dev 환경: data/leaderboard.ts 의 mock 데이터 사용.

import { useEffect, useState } from 'react';
import { MOCK_LEADERBOARD } from 'data/leaderboard';
import type { LeaderboardEntry } from 'lib/types';
import { emit, isEmbedded, setupPostMessageListener } from 'lib/postMessage';

export type LeaderboardState = {
  entries: ReadonlyArray<LeaderboardEntry>;
  myRank: number | null;
  loading: boolean;
  error: string | null;
};

export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
    myRank: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isEmbedded()) {
      // 단독 환경: mock 즉시 표시
      setState({
        entries: MOCK_LEADERBOARD,
        myRank: null,
        loading: false,
        error: null,
      });
      return;
    }

    // 임베드 환경: 부모에 리더보드 요청 → 응답 대기
    const cleanup = setupPostMessageListener({
      onLeaderboardData: (msg) => {
        setState({
          entries: msg.entries.map((e, i) => ({
            rank: e.rank ?? i + 1,
            nickname: e.nickname,
            team: e.team,
            round: e.round,
            score: e.score,
            createdAt: e.created_at,
          })),
          myRank: msg.my_rank ?? null,
          loading: false,
          error: null,
        });
      },
    });

    // 요청 emit
    emit({ type: 'CLEANUP:LEADERBOARD_REQUEST' });

    // 5초 타임아웃 → fallback mock
    const timeout = setTimeout(() => {
      setState((s) => {
        if (!s.loading) return s;
        return {
          entries: MOCK_LEADERBOARD,
          myRank: null,
          loading: false,
          error: 'timeout',
        };
      });
    }, 5000);

    return () => {
      cleanup();
      clearTimeout(timeout);
    };
  }, []);

  return state;
}
