// PostMessage 양방향 프로토콜 — 폴리볼(부모) ↔ 게임(iframe) 통신
//
// 게임은 user_id를 모릅니다. 부모 폴리볼이 모든 메시지를 받을 때 현재 로그인
// 유저에 자동 매칭해주세요. (자세한 내용은 INTEGRATION.md 참조)

import type { TeamCode } from './types';

// ============================================================
// 메시지 타입
// ============================================================

/** 게임 → 부모 (outgoing) */
export type OutgoingMessage =
  | { type: 'CLEANUP:GAME_READY' }
  | { type: 'CLEANUP:PLAY_AD'; reason: 'continue' | 'extra_session' }
  | { type: 'CLEANUP:TICKET_REWARD'; round: number; count: number }
  | {
      type: 'CLEANUP:GAME_OVER';
      round: number;          // 최고 도달 회
      score: number;          // 최종 점수
      homeruns: number;       // 누적 홈런
      hits: number;           // 누적 안타
      strikes: number;        // 누적 스트라이크(아웃)
      first_50_cleared_this_game?: boolean;
    }
  | { type: 'CLEANUP:LEADERBOARD_REQUEST' };

/** 부모 → 게임 (incoming) */
export type IncomingMessage =
  | {
      type: 'CLEANUP:USER_INFO';
      nickname: string;
      team: TeamCode;
      free_left: number;
      ad_left: number;
      daily_milestones_done?: number[];
      lifetime_50_done?: boolean;
    }
  | { type: 'CLEANUP:AD_COMPLETED' }
  | { type: 'CLEANUP:AD_FAILED'; reason: string }
  | { type: 'CLEANUP:LEADERBOARD_DATA'; entries: LeaderboardResponseEntry[]; my_rank?: number };

export type LeaderboardResponseEntry = {
  rank: number;
  nickname: string;
  team: TeamCode;
  round: number;
  score: number;
  created_at: string; // ISO date YYYY-MM-DD
  is_me?: boolean;    // 본인 row 식별용
};

// ============================================================
// 임베드 여부
// ============================================================

export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

// ============================================================
// emit (게임 → 부모)
// ============================================================

/**
 * 부모 웹뷰로 메시지 전송. 임베드 안 된 환경에서는 무시.
 */
export function emit(message: OutgoingMessage): void {
  if (typeof window === 'undefined') return;
  if (!isEmbedded()) return;
  try {
    window.parent.postMessage(message, '*');
  } catch {
    // ignore (cross-origin, etc.)
  }
}

// ============================================================
// listener (부모 → 게임)
// ============================================================

export type IncomingHandlers = {
  onUserInfo?: (msg: Extract<IncomingMessage, { type: 'CLEANUP:USER_INFO' }>) => void;
  onAdCompleted?: () => void;
  onAdFailed?: (reason: string) => void;
  onLeaderboardData?: (msg: Extract<IncomingMessage, { type: 'CLEANUP:LEADERBOARD_DATA' }>) => void;
};

/**
 * window message listener 등록. cleanup 함수 반환 (useEffect에서 사용).
 */
export function setupPostMessageListener(handlers: IncomingHandlers): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (e: MessageEvent) => {
    const msg = e.data as IncomingMessage | undefined;
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
    if (!msg.type.startsWith('CLEANUP:')) return;

    switch (msg.type) {
      case 'CLEANUP:USER_INFO':
        handlers.onUserInfo?.(msg);
        break;
      case 'CLEANUP:AD_COMPLETED':
        handlers.onAdCompleted?.();
        break;
      case 'CLEANUP:AD_FAILED':
        handlers.onAdFailed?.(msg.reason);
        break;
      case 'CLEANUP:LEADERBOARD_DATA':
        handlers.onLeaderboardData?.(msg);
        break;
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
