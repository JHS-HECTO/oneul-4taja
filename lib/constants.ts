// 점수 (스펙 3.0 초기값. 실제 운영에서 시뮬레이션 튜닝)
export const SCORE_HIT = 100;
export const SCORE_HOMERUN = 500;
export const SCORE_ROUND_CLEAR_MULTIPLIER = 50; // round × 50 보너스

// 일일 정책 (스펙 4.0)
export const DAILY_FREE_SESSIONS = 2;
export const DAILY_AD_SESSIONS = 3;
export const CONTINUES_PER_SESSION = 2; // 1트라이 + 광고 이어하기 2회

// 회 정책 (스펙 2.3)
export const MAX_PITCHES_PER_ROUND = 5;
export const HITS_TO_CLEAR_ROUND = 3;
export const STRIKES_TO_GAME_OVER = 3; // 3 스트라이크 누적 = 게임오버

// 단계 (스펙 2.5)
export const FIXED_ROUND_COUNT = 50; // 1~50 정해진 난이도 곡선, 51+ 평형

// 응모권 마일스톤 — 10회마다 1장
export const DAILY_TICKET_MILESTONES = [10, 20, 30, 40, 50] as const;
export const TICKETS_PER_MILESTONE = 1;

// 연출 타이밍 (legacy — 새 흐름은 GameScreen.tsx 의 JUDGING_TOTAL_MS 사용)
export const JUDGING_DELAY_MS = 2000;       // 게이지 정지 후 다음 phase 까지 (와인드업 + 공 + 스윙 + 결과)
export const CUTSCENE_HOMERUN_MS = 1500;    // 홈런 컷씬
export const CUTSCENE_MILESTONE_50_MS = 3000; // 50회 클리어 컷씬
export const CUTSCENE_GAMEOVER_MS = 2200;   // 게임오버 컷씬
