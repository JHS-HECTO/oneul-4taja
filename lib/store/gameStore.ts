import { create } from 'zustand';
import type { GameState, HitResult, GameUser } from 'lib/types';
import {
  SCORE_ROUND_CLEAR_MULTIPLIER,
  HITS_TO_CLEAR_ROUND,
  STRIKES_TO_GAME_OVER,
  DAILY_FREE_SESSIONS,
  DAILY_AD_SESSIONS,
  CONTINUES_PER_SESSION,
  DAILY_TICKET_MILESTONES,
  TICKETS_PER_MILESTONE,
} from 'lib/constants';

type Actions = {
  startGame: () => void;
  endIntro: () => void;
  recordPitchResult: (result: HitResult) => void;
  proceedAfterJudging: () => void;
  endCutscene: () => void;
  startContinue: () => void;
  giveUp: () => void;
  dismissReward: () => void;
  setUser: (user: GameUser) => void;
  setSessionCounters: (free: number, ad: number) => void;
  showLeaderboard: () => void;
  showDailyLimit: () => void;
  goToTitle: () => void;
};

const INITIAL_STATE: GameState = {
  phase: 'title',
  current: { round: 1, pitchIndex: 0, hits: 0, homerunInRound: false },
  totalScore: 0,
  totalHits: 0,
  totalHomeruns: 0,
  totalStrikes: 0,
  maxRoundReached: 0,
  lastResult: null,
  continuesLeft: CONTINUES_PER_SESSION,
  freeSessionsLeft: DAILY_FREE_SESSIONS,
  adSessionsLeft: DAILY_AD_SESSIONS,
  dailyMilestonesDone: [],
  lifetime50Done: false,
  user: null,
  pendingReward: null,
};

export const useGameStore = create<GameState & Actions>((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => {
    const s = get();
    set({
      ...INITIAL_STATE,
      // 유저 / 일일 카운터 / 평생 마일스톤은 유지
      user: s.user,
      freeSessionsLeft: s.freeSessionsLeft,
      adSessionsLeft: s.adSessionsLeft,
      dailyMilestonesDone: s.dailyMilestonesDone,
      lifetime50Done: s.lifetime50Done,
      phase: 'intro',
    });
  },

  endIntro: () => set({ phase: 'playing' }),

  recordPitchResult: (result) => {
    const s = get();
    const next: Partial<GameState> = {
      phase: 'judging',
      lastResult: result.outcome,
    };

    if (result.outcome === 'homerun') {
      next.totalHomeruns = s.totalHomeruns + 1;
      next.totalScore = s.totalScore + result.scoreGained;
      next.current = { ...s.current, homerunInRound: true };
    } else if (result.outcome === 'hit') {
      next.totalHits = s.totalHits + 1;
      next.totalScore = s.totalScore + result.scoreGained;
      next.current = { ...s.current, hits: s.current.hits + 1 };
    } else {
      next.totalStrikes = s.totalStrikes + 1;
    }
    set(next as GameState);
  },

  proceedAfterJudging: () => {
    const s = get();
    const r = s.current;

    // 1. 게임오버 (누적 스트라이크 3개)
    if (s.totalStrikes >= STRIKES_TO_GAME_OVER) {
      set({ phase: 'cutscene' });
      return;
    }

    // 2. 회 클리어 (홈런 1개 또는 안타 3개)
    const cleared = r.homerunInRound || r.hits >= HITS_TO_CLEAR_ROUND;
    if (cleared) {
      const bonus = r.round * SCORE_ROUND_CLEAR_MULTIPLIER;
      const newScore = s.totalScore + bonus;
      const nextRound = r.round + 1;
      const newMax = Math.max(s.maxRoundReached, r.round);

      // 응모권 마일스톤 체크 — 새로 진입할 회차(nextRound)가 milestone 이상이면 지급
      // 예) 9회 클리어 → nextRound=10 → milestone 10 즉시 지급 (10회 시작 시)
      let dailyMilestones = s.dailyMilestonesDone;
      let newlyReached: number | null = null;
      DAILY_TICKET_MILESTONES.forEach((m) => {
        if (nextRound >= m && !dailyMilestones.includes(m)) {
          dailyMilestones = [...dailyMilestones, m];
          if (newlyReached === null || m > newlyReached) newlyReached = m;
        }
      });
      const reward = newlyReached !== null
        ? { round: newlyReached, count: TICKETS_PER_MILESTONE }
        : null;

      // 평생 50회 첫 도달
      const lifetime50JustDone = r.round === 50 && !s.lifetime50Done;
      const showCutscene = r.homerunInRound || lifetime50JustDone;

      set({
        totalScore: newScore,
        maxRoundReached: newMax,
        dailyMilestonesDone: dailyMilestones,
        lifetime50Done: s.lifetime50Done || lifetime50JustDone,
        // 아웃은 회차 클리어해도 초기화하지 않음 — 게임 세션 전체에 걸쳐 누적 (3아웃까지)
        current: { round: nextRound, pitchIndex: 0, hits: 0, homerunInRound: false },
        phase: showCutscene ? 'cutscene' : 'playing',
        pendingReward: reward ?? s.pendingReward,
      });
      return;
    }

    // 3. 다음 공
    set({
      current: { ...r, pitchIndex: r.pitchIndex + 1 },
      phase: 'playing',
    });
  },

  endCutscene: () => {
    const s = get();
    if (s.totalStrikes >= STRIKES_TO_GAME_OVER) {
      if (s.continuesLeft > 0) {
        set({ phase: 'continue_prompt' });
      } else {
        set({ phase: 'result' });
      }
    } else {
      set({ phase: 'playing' });
    }
  },

  startContinue: () => {
    const s = get();
    set({
      totalStrikes: 0,
      current: { ...s.current, pitchIndex: 0, hits: 0, homerunInRound: false },
      continuesLeft: s.continuesLeft - 1,
      phase: 'playing',
    });
  },

  giveUp: () => set({ phase: 'result' }),

  dismissReward: () => set({ pendingReward: null }),

  setUser: (user) => set({ user }),
  setSessionCounters: (free, ad) => set({ freeSessionsLeft: free, adSessionsLeft: ad }),

  showLeaderboard: () => set({ phase: 'leaderboard' }),
  showDailyLimit: () => set({ phase: 'daily_limit' }),
  goToTitle: () => set({ phase: 'title' }),
}));

// 테스트용 초기 상태 노출
export const INITIAL_GAME_STATE = INITIAL_STATE;
