// 한 공의 판정 결과
export type PitchOutcome = 'homerun' | 'hit' | 'strike';

// 게임 상태머신 phase
export type GamePhase =
  | 'title'           // 시작 전 타이틀 화면
  | 'intro'           // 게임 시작 인트로 (짧은 카운트다운)
  | 'playing'         // 게이지 진동 중, 탭 대기
  | 'judging'         // 탭 직후 결과 판정 + 짧은 연출
  | 'cutscene'        // 홈런/50회/게임오버 풀스크린 컷씬
  | 'continue_prompt' // 광고 이어하기 모달
  | 'result'          // 게임 종료 결과 화면
  | 'leaderboard'     // 리더보드 화면
  | 'daily_limit';    // 일일 한도 초과

// 한 회의 진행 상태
export type RoundState = {
  round: number;            // 1, 2, 3 ... 50, 51+
  pitchIndex: number;       // 0..4 (해당 회의 몇 번째 공)
  hits: number;             // 그 회에서 친 안타 수 (0..3)
  homerunInRound: boolean;
};

// 응원팀 코드
export type TeamCode =
  | 'lg' | 'doosan' | 'kt' | 'ssg' | 'samsung'
  | 'lotte' | 'hanwha' | 'kia' | 'nc';

export type Team = {
  code: TeamCode;
  name: string;   // "LG 트윈스"
  short: string;  // "LG"
  color: string;  // 팀 컬러 hex
};

// 유저 식별 정보 (부모 측에서 주입)
export type GameUser = {
  nickname: string;
  team: TeamCode;
};

// 응모권 보상 팝업 상태
export type PendingReward = {
  round: number;   // 도달한 마일스톤 (10, 20, 30, 40, 50)
  count: number;   // 지급 응모권 수
};

// 게임 전체 상태
export type GameState = {
  phase: GamePhase;
  current: RoundState;
  totalScore: number;
  totalHits: number;
  totalHomeruns: number;
  totalStrikes: number;
  maxRoundReached: number;
  lastResult: PitchOutcome | null;
  continuesLeft: number;
  freeSessionsLeft: number;
  adSessionsLeft: number;
  dailyMilestonesDone: number[];
  lifetime50Done: boolean;
  user: GameUser | null;
  pendingReward: PendingReward | null;
};

// 회별 난이도 파라미터 — 단일 게이지, 홈런 가운데 + 안타 양옆
export type GaugeEasing = 'linear' | 'easeInOut';

export type RoundDifficulty = {
  round: number;
  gaugeSpeedMs: number;     // 게이지 좌→우 1바퀴 시간 (낮을수록 빠름)
  perfectZoneRatio: number; // 홈런존 가로 폭 (0~1)
  goodZoneRatio: number;    // 홈런존 한쪽 옆 안타존 폭 (0~1, per-side)
  easing: GaugeEasing;      // 'linear' = 균일 속도, 'easeInOut' = 가장자리 멈춤+중앙 휙
};

// 게이지 1프레임 상태
export type GaugeFrame = {
  position: number;         // 0..1, 게이지 위치
  direction: 1 | -1;
};

// 히트 판정 결과
export type HitResult = {
  outcome: PitchOutcome;
  position: number;
  scoreGained: number;
};

// 리더보드 엔트리
export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  team: TeamCode;
  round: number;
  score: number;
  createdAt: string; // ISO date (YYYY-MM-DD)
};
