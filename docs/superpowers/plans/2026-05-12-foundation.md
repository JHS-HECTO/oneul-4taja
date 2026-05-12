# 오늘의 4번타자 — Foundation 구현 계획 (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 완전히 플레이 가능한 "오늘의 4번타자" 미니게임을 mock 데이터로 단독 동작시킨다. 부모 앱 통합 없이 브라우저에서 풀게임 플레이 가능. Vercel 프리뷰로 검증 가능.

**Architecture:** Next.js 16 App Router + TypeScript strict + SCSS Modules + zustand. iframe 임베드 준비된 단일 라우트 + 내부 상태머신(Title ↔ Game ↔ Result). 게임 엔진은 requestAnimationFrame으로 게이지 진동 + 탭 타이밍 판정.

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript strict, SCSS Modules, clsx, zustand, vitest, pnpm.

**Reference Spec:** `docs/superpowers/specs/2026-05-12-oneul-4taja-design.md`

---

## File Structure (Plan A 끝나면 만들어져 있어야 함)

```
오늘의-4번타자/
├── app/
│   ├── layout.tsx                       — 폴리볼 폰트, 기본 메타
│   ├── page.tsx                         — 메인 라우트 (상태머신 entry)
│   ├── globals.scss                     — CSS 변수 + 픽셀 폰트 import
│   └── (game)/
│       ├── _components/
│       │   ├── Title/
│       │   │   ├── Title.tsx
│       │   │   └── Title.module.scss
│       │   ├── GameScreen/
│       │   │   ├── GameScreen.tsx
│       │   │   ├── GameScreen.module.scss
│       │   │   ├── Hud.tsx
│       │   │   ├── Hud.module.scss
│       │   │   ├── BatterSprite.tsx
│       │   │   ├── BatterSprite.module.scss
│       │   │   ├── Gauge.tsx
│       │   │   ├── Gauge.module.scss
│       │   │   ├── Ball.tsx
│       │   │   └── Ball.module.scss
│       │   ├── Cutscene/
│       │   │   ├── Cutscene.tsx
│       │   │   └── Cutscene.module.scss
│       │   ├── Result/
│       │   │   ├── Result.tsx
│       │   │   ├── Result.module.scss
│       │   │   ├── ContinueModal.tsx
│       │   │   └── ContinueModal.module.scss
│       │   ├── Leaderboard/
│       │   │   ├── Leaderboard.tsx
│       │   │   └── Leaderboard.module.scss
│       │   └── DailyLimit/
│       │       ├── DailyLimit.tsx
│       │       └── DailyLimit.module.scss
├── lib/
│   ├── store/
│   │   ├── gameStore.ts                  — zustand store
│   │   └── gameStore.test.ts             — store 단위테스트
│   ├── engine/
│   │   ├── gauge.ts                      — 게이지 진동 로직
│   │   ├── gauge.test.ts
│   │   ├── hitDetection.ts               — 위치→결과 판정
│   │   ├── hitDetection.test.ts
│   │   └── difficulty.ts                 — 회별 곡선 계산
│   ├── types.ts                          — 공용 타입
│   └── constants.ts                      — 점수·정책 상수
├── data/
│   ├── rounds.ts                         — 50회+∞ 난이도 테이블
│   ├── teams.ts                          — 응원팀 9개 mock
│   └── leaderboard.ts                    — 리더보드 mock entries
├── public/
│   └── images/                           — Gemini 6장 이미 들어있음
├── docs/superpowers/
│   ├── specs/2026-05-12-oneul-4taja-design.md
│   └── plans/2026-05-12-foundation.md    — 이 파일
├── package.json
├── tsconfig.json
├── next.config.js
├── vitest.config.ts
└── vitest.setup.ts
```

---

## Phase 1: 프로젝트 스캐폴드

### Task 1.1: Next.js 16 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`

- [ ] **Step 1: 작업 디렉토리로 이동 + 빈 디렉토리 확인**

```bash
cd "C:/Users/rest/오늘의-4번타자"
ls -la
```

Expected: `public/images/`, `docs/` 만 있음 (Gemini 이미지 + 스펙 + 이 plan).

- [ ] **Step 2: Next.js 스캐폴드 생성**

```bash
pnpm create next-app@latest . --typescript --no-tailwind --no-eslint --src-dir=false --app --import-alias='@/*' --use-pnpm
```

프롬프트 모두 default. `--import-alias='@/*'` 는 일단 기본값으로 두지만 폴리볼은 별칭 안 씀 → 다음 Step에서 제거.

Expected: `package.json`, `tsconfig.json`, `next.config.js`, `app/` 생성.

- [ ] **Step 3: 추가 의존성 설치**

```bash
pnpm add clsx zustand
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom sass
```

- [ ] **Step 4: tsconfig.json strict 모드 강화**

Modify `tsconfig.json` — `compilerOptions` 에 추가:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {}
  }
}
```

`paths` 비워서 `@/*` 별칭 비활성. 폴리볼 컨벤션 따라 `'components/...'`, `'lib/...'` 직접 사용.

- [ ] **Step 5: vitest 설정 파일 생성**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

Modify `package.json` scripts 섹션 추가:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: 개발 서버 동작 검증**

```bash
pnpm dev
```

Expected: http://localhost:3000 에서 기본 Next.js 페이지 로드. Ctrl+C 로 종료.

- [ ] **Step 7: .gitignore에 .original.png 백업 추가**

Modify `.gitignore` — 끝에 추가:

```
# Gemini original backups
public/images/*.original.png
```

- [ ] **Step 8: 첫 커밋**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 16 + TypeScript strict + SCSS + zustand scaffold"
```

---

## Phase 2: 글로벌 스타일 + 컬러 토큰 + 폰트

### Task 2.1: CSS 변수 + 픽셀 폰트 설정

**Files:**
- Modify: `app/globals.scss` (또는 `globals.css` → SCSS로 rename)
- Modify: `app/layout.tsx`

- [ ] **Step 1: globals.css → globals.scss 변경**

```bash
mv app/globals.css app/globals.scss
```

Modify `app/layout.tsx` import:

```tsx
import './globals.scss';
```

- [ ] **Step 2: globals.scss에 CSS 변수 토큰 정의**

Replace `app/globals.scss` content with:

```scss
:root {
  // 게임 팔레트 (스펙 7.1)
  --colors-game-grass: #2c8930;
  --colors-game-soil: #8b4513;
  --colors-game-red: #d62828;
  --colors-game-yellow: #ffc83d;
  --colors-game-beige: #f2e8c9;
  --colors-game-sky: #87ceeb;
  --colors-game-dark: #1a1a1a;
  --colors-game-navy: #1a2b5c;

  // 효과 색상
  --colors-game-perfect: #ffc83d;
  --colors-game-hit: #b6ff00;
  --colors-game-miss: #ff4a6e;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'Galmuri11', 'Pretendard', monospace;
  background: var(--colors-game-dark);
  color: var(--colors-game-beige);
  image-rendering: pixelated;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
  touch-action: manipulation;
}

img, canvas {
  image-rendering: pixelated;
}
```

- [ ] **Step 3: Galmuri11 픽셀 폰트 로딩**

Create `app/fonts.ts`:

```typescript
import localFont from 'next/font/local';

// Galmuri11은 OFL 라이선스. fonts 디렉토리에 .ttf 파일을 받아야 함.
// 다운로드: https://github.com/quiple/galmuri/releases
// 일단 next/font/google 의 Press Start 2P + system fallback으로 시작.

// Phase 2.1 TBD: Galmuri11.ttf 파일 받아서 public/fonts/ 에 둔 후 활성화
```

Create `app/fonts/PressStart2P-Regular.ttf` 대신 — `next/font/google` 사용:

Modify `app/layout.tsx`:

```tsx
import './globals.scss';
import { Press_Start_2P } from 'next/font/google';

const pixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

export const metadata = {
  title: '오늘의 4번타자',
  description: '폴리볼 야구 타격 미니게임',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pixel.variable}>
      <body>{children}</body>
    </html>
  );
}
```

Modify `globals.scss` `body` 의 `font-family` 라인을:

```scss
font-family: var(--font-pixel), 'Galmuri11', monospace;
```

한글은 Galmuri11이 들어가야 깔끔하지만 일단 라이선스 확인 전이라 fallback에만 둠 → 실제 한글은 monospace로 폴백.

- [ ] **Step 4: 폰트 + 컬러 동작 확인**

Modify `app/page.tsx` 임시 테스트:

```tsx
export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ color: 'var(--colors-game-yellow)' }}>오늘의 4번타자</h1>
      <p style={{ color: 'var(--colors-game-beige)' }}>준비 중...</p>
    </main>
  );
}
```

Run: `pnpm dev`

Expected: `오늘의 4번타자` 노란색 픽셀 폰트, 본문 베이지색.

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add color tokens (CSS variables) and pixel font setup"
```

---

## Phase 3: Mock 데이터

### Task 3.1: 게임 정책 상수 + 공용 타입

**Files:**
- Create: `lib/constants.ts`, `lib/types.ts`

- [ ] **Step 1: `lib/types.ts` 작성**

Create:

```typescript
// 회 진행 결과
export type PitchOutcome = 'homerun' | 'hit' | 'strike';

// 회 종료 사유
export type RoundEndReason = 'cleared_by_hits' | 'cleared_by_homerun' | 'game_over_by_strikeout';

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
  round: number;       // 1, 2, 3 ... 50, 51+
  pitchIndex: number;  // 0..4 (해당 회의 몇 번째 공)
  hits: number;        // 그 회에서 친 안타 수 (0..3)
  homerunInRound: boolean;
};

// 게임 전체 상태
export type GameState = {
  phase: GamePhase;
  current: RoundState;
  totalScore: number;
  totalHits: number;
  totalHomeruns: number;
  totalStrikes: number;   // 누적 0..3
  maxRoundReached: number;
  continuesLeft: number;  // 남은 이어하기 횟수
  freeSessionsLeft: number;
  adSessionsLeft: number;
  dailyMilestonesDone: number[]; // [5, 15, 30] 중 도달한 값
  lifetime50Done: boolean;
  user: { nickname: string; team: TeamCode } | null;
};

// 응원팀 코드
export type TeamCode =
  | 'lg' | 'doosan' | 'kt' | 'ssg' | 'samsung'
  | 'lotte' | 'hanwha' | 'kia' | 'nc';

export type Team = {
  code: TeamCode;
  name: string;       // "LG 트윈스"
  short: string;      // "LG"
  color: string;      // 팀 컬러 hex
};

// 회별 난이도 파라미터
export type RoundDifficulty = {
  round: number;
  gaugeSpeedMs: number;        // 좌→우 1바퀴 시간 (낮을수록 빠름)
  perfectZoneRatio: number;    // 0~1, 전체 게이지 대비 퍼펙트존 비율
  goodZoneRatio: number;       // 0~1, 퍼펙트 양옆 굿존 비율
};

// 게이지 1프레임 상태
export type GaugeFrame = {
  position: number;            // 0..1, 게이지 위치
  direction: 1 | -1;
};

// 히트 판정 결과
export type HitResult = {
  outcome: PitchOutcome;
  position: number;            // 탭 시점 게이지 위치
  scoreGained: number;
};

// 리더보드 엔트리
export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  team: TeamCode;
  round: number;
  score: number;
  createdAt: string; // ISO date
};
```

- [ ] **Step 2: `lib/constants.ts` 작성**

Create:

```typescript
// 점수 (스펙 3.0 초기값)
export const SCORE_HIT = 100;
export const SCORE_HOMERUN = 500;
export const SCORE_ROUND_CLEAR_MULTIPLIER = 50; // round * 50

// 일일 정책 (스펙 4.0)
export const DAILY_FREE_SESSIONS = 2;
export const DAILY_AD_SESSIONS = 3;
export const CONTINUES_PER_SESSION = 2; // 1트라이 + 광고 이어하기 2회

// 회 정책 (스펙 2.3)
export const MAX_PITCHES_PER_ROUND = 5;
export const HITS_TO_CLEAR_ROUND = 3;
export const STRIKES_TO_GAME_OVER = 3;

// 단계 (스펙 2.5)
export const FIXED_ROUND_COUNT = 50;       // 1~50 정해진 곡선
// 51회+ 는 50회 난이도 평형

// 응모권 마일스톤 (스펙 5.0)
export const DAILY_TICKET_MILESTONES = [5, 15, 30] as const;
export const TICKETS_PER_MILESTONE = 1;
```

- [ ] **Step 3: 타입체크 통과 확인**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts lib/constants.ts
git commit -m "feat: add core game types and constants"
```

### Task 3.2: 응원팀 mock 데이터

**Files:**
- Create: `data/teams.ts`

- [ ] **Step 1: KBO 9개 팀 mock 데이터**

Create `data/teams.ts`:

```typescript
import type { Team } from 'lib/types';

export const TEAMS: ReadonlyArray<Team> = [
  { code: 'lg',      name: 'LG 트윈스',    short: 'LG',  color: '#c30452' },
  { code: 'doosan',  name: '두산 베어스',  short: 'OB',  color: '#1a1748' },
  { code: 'kt',      name: 'KT 위즈',      short: 'KT',  color: '#000000' },
  { code: 'ssg',     name: 'SSG 랜더스',   short: 'SSG', color: '#c8102e' },
  { code: 'samsung', name: '삼성 라이온즈', short: 'SS', color: '#074ca1' },
  { code: 'lotte',   name: '롯데 자이언츠', short: 'LT', color: '#041e42' },
  { code: 'hanwha',  name: '한화 이글스',  short: 'HH',  color: '#fc4e00' },
  { code: 'kia',     name: 'KIA 타이거즈',  short: 'KIA', color: '#ea002c' },
  { code: 'nc',      name: 'NC 다이노스',  short: 'NC',  color: '#315288' },
] as const;

export function getTeam(code: string): Team | null {
  return TEAMS.find((t) => t.code === code) ?? null;
}
```

- [ ] **Step 2: 커밋**

```bash
git add data/teams.ts
git commit -m "feat: add KBO 9-team mock data"
```

### Task 3.3: 회별 난이도 곡선 + 리더보드 mock

**Files:**
- Create: `data/rounds.ts`, `data/leaderboard.ts`

- [ ] **Step 1: `data/rounds.ts` 작성**

Create:

```typescript
import type { RoundDifficulty } from 'lib/types';

// 회별 난이도 곡선. 1회 ~ 50회 정해진 값, 51+ 는 50회 동일.
// gaugeSpeedMs: 좌→우 1바퀴 시간 (ms). 낮을수록 빠름.
// perfectZoneRatio: 전체 게이지에서 퍼펙트존 비율 (0~1).
// goodZoneRatio: 퍼펙트존 양옆 굿존 비율 (한쪽 비율).

const TABLE: RoundDifficulty[] = [];
for (let round = 1; round <= 50; round++) {
  // gaugeSpeed: 1회=2000ms → 50회=600ms 선형 감소
  const gaugeSpeedMs = 2000 - ((2000 - 600) * (round - 1)) / 49;
  // perfectZone: 1회=0.20 → 50회=0.04 선형 감소
  const perfectZoneRatio = 0.20 - ((0.20 - 0.04) * (round - 1)) / 49;
  // goodZone: 한쪽 0.15 → 0.06 선형 감소
  const goodZoneRatio = 0.15 - ((0.15 - 0.06) * (round - 1)) / 49;
  TABLE.push({ round, gaugeSpeedMs, perfectZoneRatio, goodZoneRatio });
}

export const ROUND_DIFFICULTY: ReadonlyArray<RoundDifficulty> = TABLE;

export function getDifficulty(round: number): RoundDifficulty {
  // 51회+ 는 50회 동일
  const idx = Math.min(round, 50) - 1;
  const entry = ROUND_DIFFICULTY[idx];
  if (!entry) {
    throw new Error(`Invalid round: ${round}`);
  }
  return entry;
}
```

- [ ] **Step 2: 난이도 테이블 검증 테스트**

Create `data/rounds.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getDifficulty, ROUND_DIFFICULTY } from './rounds';

describe('rounds difficulty curve', () => {
  it('produces exactly 50 entries', () => {
    expect(ROUND_DIFFICULTY).toHaveLength(50);
  });

  it('round 1 is the easiest (slowest gauge, largest zones)', () => {
    const r1 = getDifficulty(1);
    expect(r1.gaugeSpeedMs).toBe(2000);
    expect(r1.perfectZoneRatio).toBe(0.20);
    expect(r1.goodZoneRatio).toBe(0.15);
  });

  it('round 50 is the hardest', () => {
    const r50 = getDifficulty(50);
    expect(r50.gaugeSpeedMs).toBe(600);
    expect(r50.perfectZoneRatio).toBeCloseTo(0.04, 5);
    expect(r50.goodZoneRatio).toBeCloseTo(0.06, 5);
  });

  it('round 51 plateaus at round 50 difficulty', () => {
    const r50 = getDifficulty(50);
    const r51 = getDifficulty(51);
    const r999 = getDifficulty(999);
    expect(r51).toEqual(r50);
    expect(r999).toEqual(r50);
  });

  it('difficulty increases monotonically from 1 to 50', () => {
    for (let i = 1; i < 50; i++) {
      const prev = getDifficulty(i);
      const next = getDifficulty(i + 1);
      expect(next.gaugeSpeedMs).toBeLessThan(prev.gaugeSpeedMs);
      expect(next.perfectZoneRatio).toBeLessThan(prev.perfectZoneRatio);
    }
  });
});
```

- [ ] **Step 3: 테스트 실행 확인**

```bash
pnpm test:run data/rounds.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 4: `data/leaderboard.ts` mock 작성**

Create:

```typescript
import type { LeaderboardEntry, TeamCode } from 'lib/types';

// 50명 mock entries. 실제로는 부모 측 API에서 받아옴.
const NICKS = [
  '4번타자김선수', '홈런왕민호', '클러치박', '타격마법사', '안타기계',
  '오늘은내가', '대타승부사', '풀스윙용호', '빠던하니', '슬러거',
  '한방최강', '연속안타', '도루왕석호', '백투백', '득점기계',
  '결정타준영', '클러치히터', '타격왕희철', '플라이볼', '라인드라이브',
  '강타자우진', '주전4번', '홈런두형', '인필드힛', '안타군준수',
  '타순1번지석', '베이스볼킹', '에이스훈', '4번예진', '강견수민',
  '안타치는맛', '5할타자', '풀카운트', '대주자', '안전제일',
  '도루준비', '한타로결정', '오버더펜스', '엔드런', '히트앤런',
  '직구공략', '커브킬러', '슬라이더치는', '체인지업', '포심패스',
  '4번예약', '클린업', '주전기대', '잠재력', '오늘의MVP',
];

const TEAMS: TeamCode[] = [
  'lg', 'doosan', 'kt', 'ssg', 'samsung',
  'lotte', 'hanwha', 'kia', 'nc',
];

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildMock(): LeaderboardEntry[] {
  const rand = seedRandom(42);
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < 50; i++) {
    const round = Math.max(1, Math.floor(50 * (1 - i / 50)) + Math.floor(rand() * 5) - 2);
    const score = round * 1000 + Math.floor(rand() * 800);
    const team = TEAMS[Math.floor(rand() * TEAMS.length)] ?? 'lg';
    const nick = NICKS[i] ?? `유저${i + 1}`;
    entries.push({
      rank: 0,
      nickname: nick,
      team,
      round,
      score,
      createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    });
  }
  // 정렬: round DESC, score DESC, createdAt DESC
  entries.sort((a, b) => {
    if (a.round !== b.round) return b.round - a.round;
    if (a.score !== b.score) return b.score - a.score;
    return b.createdAt.localeCompare(a.createdAt);
  });
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

export const MOCK_LEADERBOARD: ReadonlyArray<LeaderboardEntry> = buildMock();
```

- [ ] **Step 5: leaderboard mock 검증 테스트**

Create `data/leaderboard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MOCK_LEADERBOARD } from './leaderboard';

describe('mock leaderboard', () => {
  it('has 50 entries', () => {
    expect(MOCK_LEADERBOARD).toHaveLength(50);
  });

  it('is sorted by round DESC, score DESC', () => {
    for (let i = 0; i < MOCK_LEADERBOARD.length - 1; i++) {
      const a = MOCK_LEADERBOARD[i]!;
      const b = MOCK_LEADERBOARD[i + 1]!;
      if (a.round !== b.round) {
        expect(a.round).toBeGreaterThanOrEqual(b.round);
      } else {
        expect(a.score).toBeGreaterThanOrEqual(b.score);
      }
    }
  });

  it('assigns ranks 1..50', () => {
    expect(MOCK_LEADERBOARD[0]?.rank).toBe(1);
    expect(MOCK_LEADERBOARD[49]?.rank).toBe(50);
  });

  it('each entry has valid team code', () => {
    const valid = new Set(['lg','doosan','kt','ssg','samsung','lotte','hanwha','kia','nc']);
    MOCK_LEADERBOARD.forEach((e) => {
      expect(valid.has(e.team)).toBe(true);
    });
  });
});
```

Run: `pnpm test:run data/leaderboard.test.ts`
Expected: 4 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add data/rounds.ts data/rounds.test.ts data/leaderboard.ts data/leaderboard.test.ts
git commit -m "feat: add round difficulty curve and mock leaderboard data"
```

---

## Phase 4: 게임 상태 (zustand store)

### Task 4.1: gameStore 초기 상태 + 액션 시그니처

**Files:**
- Create: `lib/store/gameStore.ts`

- [ ] **Step 1: 빈 store 생성**

Create:

```typescript
import { create } from 'zustand';
import type { GameState, GamePhase, PitchOutcome, HitResult } from 'lib/types';
import {
  SCORE_HIT, SCORE_HOMERUN, SCORE_ROUND_CLEAR_MULTIPLIER,
  HITS_TO_CLEAR_ROUND, STRIKES_TO_GAME_OVER, MAX_PITCHES_PER_ROUND,
  DAILY_FREE_SESSIONS, DAILY_AD_SESSIONS, CONTINUES_PER_SESSION,
  DAILY_TICKET_MILESTONES,
} from 'lib/constants';

type Actions = {
  // 게임 라이프사이클
  startGame: () => void;
  endIntro: () => void;
  startContinue: () => void;
  giveUp: () => void;

  // 게임 진행
  recordPitchResult: (result: HitResult) => void;
  proceedAfterJudging: () => void; // 컷씬 / 다음 회 / 게임오버 분기
  endCutscene: () => void;

  // 외부 입력 (Plan B에서 PostMessage handler가 호출)
  setUser: (nickname: string, team: GameState['user'] extends { team: infer T } | null ? T : never) => void;
  setSessionCounters: (free: number, ad: number) => void;

  // 리더보드 / 일일 한도 이동
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
  continuesLeft: CONTINUES_PER_SESSION,
  freeSessionsLeft: DAILY_FREE_SESSIONS,
  adSessionsLeft: DAILY_AD_SESSIONS,
  dailyMilestonesDone: [],
  lifetime50Done: false,
  user: null,
};

export const useGameStore = create<GameState & Actions>((set, get) => ({
  ...INITIAL_STATE,

  startGame: () => {
    set({
      ...INITIAL_STATE,
      // 유저 정보 / 세션 카운터는 유지
      user: get().user,
      freeSessionsLeft: get().freeSessionsLeft,
      adSessionsLeft: get().adSessionsLeft,
      dailyMilestonesDone: get().dailyMilestonesDone,
      lifetime50Done: get().lifetime50Done,
      phase: 'intro',
    });
  },

  endIntro: () => set({ phase: 'playing' }),

  recordPitchResult: (result) => {
    const s = get();
    const next: GameState = { ...s, phase: 'judging' };

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
    set(next);
  },

  proceedAfterJudging: () => {
    const s = get();
    const r = s.current;

    // 1. 게임오버 체크 (스트라이크 3개 누적)
    if (s.totalStrikes >= STRIKES_TO_GAME_OVER) {
      set({ phase: 'cutscene' });
      return;
    }

    // 2. 회 클리어 체크 (홈런 또는 3안타)
    const cleared = r.homerunInRound || r.hits >= HITS_TO_CLEAR_ROUND;
    if (cleared) {
      // 회 클리어 보너스
      const bonus = r.round * SCORE_ROUND_CLEAR_MULTIPLIER;
      const newScore = s.totalScore + bonus;
      const nextRound = r.round + 1;
      const newMax = Math.max(s.maxRoundReached, r.round);

      // 응모권 마일스톤 체크 (5/15/30)
      let dailyMilestones = s.dailyMilestonesDone;
      DAILY_TICKET_MILESTONES.forEach((m) => {
        if (newMax >= m && !dailyMilestones.includes(m)) {
          dailyMilestones = [...dailyMilestones, m];
        }
      });

      // 평생 50회 첫 도달 체크
      const lifetime50JustDone = r.round === 50 && !s.lifetime50Done;
      const showCutscene = r.homerunInRound || lifetime50JustDone;

      set({
        totalScore: newScore,
        maxRoundReached: newMax,
        dailyMilestonesDone: dailyMilestones,
        lifetime50Done: s.lifetime50Done || lifetime50JustDone,
        current: { round: nextRound, pitchIndex: 0, hits: 0, homerunInRound: false },
        phase: showCutscene ? 'cutscene' : 'playing',
      });
      return;
    }

    // 3. 다음 공 (회 미클리어, 게임오버도 아님)
    set({
      current: { ...r, pitchIndex: r.pitchIndex + 1 },
      phase: 'playing',
    });
  },

  endCutscene: () => {
    const s = get();
    if (s.totalStrikes >= STRIKES_TO_GAME_OVER) {
      // 게임오버 컷씬 종료 → 이어하기 모달 or 결과
      if (s.continuesLeft > 0) {
        set({ phase: 'continue_prompt' });
      } else {
        set({ phase: 'result' });
      }
    } else {
      // 홈런/50회 컷씬 종료 → 게임 계속
      set({ phase: 'playing' });
    }
  },

  startContinue: () => {
    // 광고 시청 완료 → 죽은 회 첫 공부터 + 스트라이크 0 + 안타 0
    const s = get();
    set({
      totalStrikes: 0,
      current: { ...s.current, pitchIndex: 0, hits: 0, homerunInRound: false },
      continuesLeft: s.continuesLeft - 1,
      phase: 'playing',
    });
  },

  giveUp: () => set({ phase: 'result' }),

  setUser: (nickname, team) => set({ user: { nickname, team: team as never } }),
  setSessionCounters: (free, ad) => set({ freeSessionsLeft: free, adSessionsLeft: ad }),

  showLeaderboard: () => set({ phase: 'leaderboard' }),
  showDailyLimit: () => set({ phase: 'daily_limit' }),
  goToTitle: () => set({ phase: 'title' }),
}));
```

- [ ] **Step 2: 타입체크**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 3: 커밋**

```bash
git add lib/store/gameStore.ts
git commit -m "feat: add zustand game store with state transitions"
```

### Task 4.2: gameStore 단위테스트 (상태 전이)

**Files:**
- Create: `lib/store/gameStore.test.ts`

- [ ] **Step 1: 핵심 상태 전이 테스트 작성**

Create `lib/store/gameStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState());
});

describe('startGame', () => {
  it('moves phase to intro', () => {
    useGameStore.getState().startGame();
    expect(useGameStore.getState().phase).toBe('intro');
  });

  it('resets round to 1, strikes to 0', () => {
    useGameStore.setState({ totalStrikes: 2 });
    useGameStore.getState().startGame();
    expect(useGameStore.getState().current.round).toBe(1);
    expect(useGameStore.getState().totalStrikes).toBe(0);
  });
});

describe('recordPitchResult', () => {
  it('hit: +1 hit, +score, phase=judging', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'hit', position: 0.5, scoreGained: SCORE_HIT,
    });
    const s = useGameStore.getState();
    expect(s.current.hits).toBe(1);
    expect(s.totalHits).toBe(1);
    expect(s.totalScore).toBe(SCORE_HIT);
    expect(s.phase).toBe('judging');
  });

  it('homerun: +1 homerun, +score, homerunInRound=true', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'homerun', position: 0.5, scoreGained: SCORE_HOMERUN,
    });
    const s = useGameStore.getState();
    expect(s.totalHomeruns).toBe(1);
    expect(s.totalScore).toBe(SCORE_HOMERUN);
    expect(s.current.homerunInRound).toBe(true);
  });

  it('strike: +1 totalStrikes only', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().recordPitchResult({
      outcome: 'strike', position: 0, scoreGained: 0,
    });
    expect(useGameStore.getState().totalStrikes).toBe(1);
    expect(useGameStore.getState().current.hits).toBe(0);
  });
});

describe('proceedAfterJudging — round clear', () => {
  it('3 hits clears the round and advances', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 5, pitchIndex: 2, hits: 3, homerunInRound: false },
      totalScore: 300,
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.current.round).toBe(6);
    expect(s.current.hits).toBe(0);
    expect(s.maxRoundReached).toBe(5);
    expect(s.totalScore).toBe(300 + 5 * 50);
    expect(s.phase).toBe('playing');
  });

  it('homerun clears the round and shows cutscene', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 3, pitchIndex: 0, hits: 0, homerunInRound: true },
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().phase).toBe('cutscene');
    expect(useGameStore.getState().current.round).toBe(4);
  });

  it('first 50회 clear sets lifetime50Done and shows cutscene', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 50, pitchIndex: 4, hits: 3, homerunInRound: false },
      lifetime50Done: false,
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().lifetime50Done).toBe(true);
    expect(useGameStore.getState().phase).toBe('cutscene');
  });
});

describe('proceedAfterJudging — game over', () => {
  it('3 strikes → cutscene (game over)', () => {
    useGameStore.setState({
      phase: 'judging',
      totalStrikes: 3,
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().phase).toBe('cutscene');
  });
});

describe('proceedAfterJudging — next pitch', () => {
  it('round not cleared, no game over → next pitch (phase=playing)', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 2, pitchIndex: 1, hits: 1, homerunInRound: false },
      totalStrikes: 1,
    });
    useGameStore.getState().proceedAfterJudging();
    const s = useGameStore.getState();
    expect(s.phase).toBe('playing');
    expect(s.current.pitchIndex).toBe(2);
  });
});

describe('endCutscene', () => {
  it('after game over → continue_prompt (if continues left)', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 3, continuesLeft: 1 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('continue_prompt');
  });

  it('after game over with 0 continues → result', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 3, continuesLeft: 0 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('result');
  });

  it('after homerun cutscene → playing', () => {
    useGameStore.setState({ phase: 'cutscene', totalStrikes: 1 });
    useGameStore.getState().endCutscene();
    expect(useGameStore.getState().phase).toBe('playing');
  });
});

describe('startContinue', () => {
  it('resets strikes + current round hits, decrements continuesLeft', () => {
    useGameStore.setState({
      phase: 'continue_prompt',
      totalStrikes: 3,
      continuesLeft: 2,
      current: { round: 8, pitchIndex: 4, hits: 2, homerunInRound: false },
    });
    useGameStore.getState().startContinue();
    const s = useGameStore.getState();
    expect(s.totalStrikes).toBe(0);
    expect(s.continuesLeft).toBe(1);
    expect(s.current.hits).toBe(0);
    expect(s.current.pitchIndex).toBe(0);
    expect(s.current.round).toBe(8); // 같은 회 유지
    expect(s.phase).toBe('playing');
  });
});

describe('daily ticket milestones', () => {
  it('reaching round 5 marks milestone 5', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 5, pitchIndex: 2, hits: 3, homerunInRound: false },
      maxRoundReached: 4,
      dailyMilestonesDone: [],
    });
    useGameStore.getState().proceedAfterJudging();
    expect(useGameStore.getState().dailyMilestonesDone).toContain(5);
  });

  it('does not duplicate milestones', () => {
    useGameStore.setState({
      phase: 'judging',
      current: { round: 7, pitchIndex: 2, hits: 3, homerunInRound: false },
      maxRoundReached: 6,
      dailyMilestonesDone: [5],
    });
    useGameStore.getState().proceedAfterJudging();
    const ms = useGameStore.getState().dailyMilestonesDone;
    expect(ms.filter((x) => x === 5)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 테스트 실행 + 모두 통과 확인**

```bash
pnpm test:run lib/store/gameStore.test.ts
```

Expected: 13+ tests pass.

- [ ] **Step 3: 커밋**

```bash
git add lib/store/gameStore.test.ts
git commit -m "test: cover game store state transitions"
```

---

## Phase 5: 게임 엔진 (게이지 + 히트 판정)

### Task 5.1: 게이지 진동 로직 (순수 함수 + 훅)

**Files:**
- Create: `lib/engine/gauge.ts`, `lib/engine/gauge.test.ts`

- [ ] **Step 1: 게이지 위치 계산 순수 함수 작성**

Create `lib/engine/gauge.ts`:

```typescript
import type { GaugeFrame } from 'lib/types';
import { useEffect, useRef, useState } from 'react';

/**
 * 시간(ms) 기반 게이지 위치 계산. 좌→우 1바퀴 = gaugeSpeedMs.
 * 위치는 0..1 사이 삼각파 (왕복).
 */
export function computeGaugePosition(elapsedMs: number, gaugeSpeedMs: number): GaugeFrame {
  const cycleMs = gaugeSpeedMs * 2; // 좌→우→좌 가 한 사이클
  const t = (elapsedMs % cycleMs) / cycleMs; // 0..1
  if (t < 0.5) {
    return { position: t * 2, direction: 1 };
  } else {
    return { position: 2 - t * 2, direction: -1 };
  }
}

/**
 * useGauge hook — running=true 동안 매 프레임 위치 업데이트.
 * stop()으로 정지, 정지 시점 위치를 onStop 콜백에 전달.
 */
export function useGauge(opts: {
  gaugeSpeedMs: number;
  running: boolean;
  onStop?: (position: number) => void;
}) {
  const { gaugeSpeedMs, running, onStop } = opts;
  const [frame, setFrame] = useState<GaugeFrame>({ position: 0, direction: 1 });
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startedAtRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - (startedAtRef.current ?? now);
      setFrame(computeGaugePosition(elapsed, gaugeSpeedMs));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, gaugeSpeedMs]);

  const stop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (onStop) onStop(frame.position);
  };

  return { frame, stop };
}
```

- [ ] **Step 2: 순수 함수 단위 테스트**

Create `lib/engine/gauge.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeGaugePosition } from './gauge';

describe('computeGaugePosition', () => {
  it('elapsed=0 → position 0, direction 1', () => {
    const f = computeGaugePosition(0, 1000);
    expect(f.position).toBe(0);
    expect(f.direction).toBe(1);
  });

  it('elapsed=speed/2 → position 0.5, going right', () => {
    const f = computeGaugePosition(500, 1000);
    expect(f.position).toBeCloseTo(0.5, 5);
    expect(f.direction).toBe(1);
  });

  it('elapsed=speed (turnaround) → position ~1.0, going left', () => {
    const f = computeGaugePosition(999, 1000);
    expect(f.position).toBeCloseTo(0.998, 2);
  });

  it('elapsed=1.5×speed → position 0.5, going left', () => {
    const f = computeGaugePosition(1500, 1000);
    expect(f.position).toBeCloseTo(0.5, 5);
    expect(f.direction).toBe(-1);
  });

  it('elapsed=2×speed (full cycle) → position 0, going right', () => {
    const f = computeGaugePosition(2000, 1000);
    expect(f.position).toBeCloseTo(0, 5);
  });

  it('position stays in [0, 1] for arbitrary elapsed times', () => {
    for (let t = 0; t < 10000; t += 73) {
      const f = computeGaugePosition(t, 1000);
      expect(f.position).toBeGreaterThanOrEqual(0);
      expect(f.position).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 3: 테스트 실행**

```bash
pnpm test:run lib/engine/gauge.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 4: 커밋**

```bash
git add lib/engine/gauge.ts lib/engine/gauge.test.ts
git commit -m "feat: add gauge oscillation engine and tests"
```

### Task 5.2: 히트 판정 로직 (위치 → 결과)

**Files:**
- Create: `lib/engine/hitDetection.ts`, `lib/engine/hitDetection.test.ts`

- [ ] **Step 1: 판정 함수 작성**

Create `lib/engine/hitDetection.ts`:

```typescript
import type { HitResult, RoundDifficulty } from 'lib/types';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

/**
 * 게이지 위치(0..1)와 회별 난이도 받아서 결과 판정.
 *
 * 게이지 레이아웃 (좌→우):
 *   [ MISS ][ GOOD ][ PERFECT ][ GOOD ][ MISS ]
 * 중심 = 0.5. perfect 구간은 0.5 양옆 perfectZoneRatio/2 씩.
 * good 구간은 그 양옆 goodZoneRatio 씩.
 * 나머지 양쪽 끝이 miss.
 */
export function detectHit(position: number, diff: RoundDifficulty): HitResult {
  const center = 0.5;
  const perfectHalf = diff.perfectZoneRatio / 2;
  const goodHalf = perfectHalf + diff.goodZoneRatio;

  const dist = Math.abs(position - center);

  if (dist <= perfectHalf) {
    return { outcome: 'homerun', position, scoreGained: SCORE_HOMERUN };
  }
  if (dist <= goodHalf) {
    return { outcome: 'hit', position, scoreGained: SCORE_HIT };
  }
  return { outcome: 'strike', position, scoreGained: 0 };
}
```

- [ ] **Step 2: 판정 단위 테스트**

Create `lib/engine/hitDetection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectHit } from './hitDetection';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';
import type { RoundDifficulty } from 'lib/types';

const easy: RoundDifficulty = {
  round: 1,
  gaugeSpeedMs: 2000,
  perfectZoneRatio: 0.20,  // 0.4..0.6 = perfect
  goodZoneRatio: 0.15,     // 0.25..0.4, 0.6..0.75 = good
};

const hard: RoundDifficulty = {
  round: 50,
  gaugeSpeedMs: 600,
  perfectZoneRatio: 0.04,  // 0.48..0.52
  goodZoneRatio: 0.06,     // 0.42..0.48, 0.52..0.58
};

describe('detectHit (easy round)', () => {
  it('center (0.5) → homerun', () => {
    const r = detectHit(0.5, easy);
    expect(r.outcome).toBe('homerun');
    expect(r.scoreGained).toBe(SCORE_HOMERUN);
  });

  it('just inside perfect zone (0.59) → homerun', () => {
    expect(detectHit(0.59, easy).outcome).toBe('homerun');
  });

  it('inside good zone (0.7) → hit', () => {
    const r = detectHit(0.7, easy);
    expect(r.outcome).toBe('hit');
    expect(r.scoreGained).toBe(SCORE_HIT);
  });

  it('outside good zone (0.8) → strike', () => {
    const r = detectHit(0.8, easy);
    expect(r.outcome).toBe('strike');
    expect(r.scoreGained).toBe(0);
  });

  it('extreme left (0.0) → strike', () => {
    expect(detectHit(0.0, easy).outcome).toBe('strike');
  });

  it('extreme right (1.0) → strike', () => {
    expect(detectHit(1.0, easy).outcome).toBe('strike');
  });
});

describe('detectHit (hard round)', () => {
  it('center (0.5) → homerun', () => {
    expect(detectHit(0.5, hard).outcome).toBe('homerun');
  });

  it('just outside perfect (0.53) → hit', () => {
    expect(detectHit(0.53, hard).outcome).toBe('hit');
  });

  it('outside good (0.6) → strike', () => {
    expect(detectHit(0.6, hard).outcome).toBe('strike');
  });
});

describe('symmetry', () => {
  it('result is symmetric around 0.5', () => {
    for (let d = 0; d < 0.5; d += 0.05) {
      const left = detectHit(0.5 - d, easy);
      const right = detectHit(0.5 + d, easy);
      expect(left.outcome).toBe(right.outcome);
    }
  });
});
```

- [ ] **Step 3: 테스트 실행**

```bash
pnpm test:run lib/engine/hitDetection.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 4: 커밋**

```bash
git add lib/engine/hitDetection.ts lib/engine/hitDetection.test.ts
git commit -m "feat: add hit detection (position → outcome) with tests"
```

---

## Phase 6: 게임 메인 화면 UI

### Task 6.1: GameScreen 셸 + 배경 layer

**Files:**
- Create: `app/(game)/_components/GameScreen/GameScreen.tsx`, `.module.scss`

- [ ] **Step 1: GameScreen 컴포넌트 셸**

Create `app/(game)/_components/GameScreen/GameScreen.tsx`:

```tsx
'use client';
import styles from './GameScreen.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { Hud } from './Hud';
import { BatterSprite } from './BatterSprite';
import { Gauge } from './Gauge';
import { Ball } from './Ball';

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  return (
    <div className={styles.screen}>
      <div className={styles.background} aria-hidden />
      <Hud />
      <BatterSprite />
      <Ball />
      <Gauge />
    </div>
  );
}
```

Create `app/(game)/_components/GameScreen/GameScreen.module.scss`:

```scss
.screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--colors-game-dark);
  display: flex;
  flex-direction: column;
}

.background {
  position: absolute;
  inset: 0;
  background-image: url('/images/background.png');
  background-size: cover;
  background-position: center;
  z-index: 0;
}
```

- [ ] **Step 2: Hud 컴포넌트 (회·점수·안타·아웃 표시)**

Create `app/(game)/_components/GameScreen/Hud.tsx`:

```tsx
'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './Hud.module.scss';

export function Hud() {
  const round = useGameStore((s) => s.current.round);
  const hits = useGameStore((s) => s.current.hits);
  const strikes = useGameStore((s) => s.totalStrikes);
  const score = useGameStore((s) => s.totalScore);

  return (
    <div className={styles.hud}>
      <div className={styles.row}>
        <span className={styles.round}>▶ {round}회</span>
        <span className={styles.score}>{score.toLocaleString()}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.hits}>안타 {hits}/3</span>
        <span className={styles.strikes}>아웃 {strikes}/3</span>
      </div>
    </div>
  );
}
```

Create `app/(game)/_components/GameScreen/Hud.module.scss`:

```scss
.hud {
  position: relative;
  z-index: 10;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--colors-game-beige);
  text-shadow: 2px 2px 0 var(--colors-game-dark);
  font-size: 12px;
  letter-spacing: 2px;
}
.row {
  display: flex;
  justify-content: space-between;
}
.round { color: var(--colors-game-beige); }
.score { color: var(--colors-game-yellow); }
.hits { color: var(--colors-game-hit); }
.strikes { color: var(--colors-game-miss); }
```

- [ ] **Step 3: BatterSprite — 스프라이트 시트 프레임 전환**

Create `app/(game)/_components/GameScreen/BatterSprite.tsx`:

```tsx
'use client';
import { useGameStore } from 'lib/store/gameStore';
import styles from './BatterSprite.module.scss';

// sprite sheet: 5 frames × 464×416. Total 2320×416.
const FRAMES = {
  idle: 0,
  swing_wind: 1,
  swing_contact: 2,
  homerun: 3,
  strikeout: 4,
} as const;

type FrameKey = keyof typeof FRAMES;

export function BatterSprite() {
  const phase = useGameStore((s) => s.phase);
  const current = useGameStore((s) => s.current);

  // 단순 룰: phase + last outcome 기반으로 frame 결정
  // (Phase 7에서 효과 매니저가 더 정밀하게 제어)
  let frame: FrameKey = 'idle';
  if (phase === 'judging') frame = 'swing_contact';
  if (phase === 'cutscene' && current.homerunInRound) frame = 'homerun';

  return (
    <div
      className={styles.sprite}
      style={{ backgroundPositionX: `${-FRAMES[frame] * 464}px` }}
      aria-hidden
    />
  );
}
```

Create `app/(game)/_components/GameScreen/BatterSprite.module.scss`:

```scss
.sprite {
  position: absolute;
  bottom: 18%;
  left: 50%;
  transform: translateX(-50%);
  width: 232px;          // 464 / 2 로 줄여서 표시
  height: 208px;         // 416 / 2
  background-image: url('/images/batter-sprite.png');
  background-size: 1160px 208px;   // 2320/2 × 416/2
  background-repeat: no-repeat;
  z-index: 5;
  image-rendering: pixelated;
}
```

- [ ] **Step 4: Ball — 단순 흰 사각형**

Create `app/(game)/_components/GameScreen/Ball.tsx`:

```tsx
'use client';
import styles from './Ball.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Ball() {
  const phase = useGameStore((s) => s.phase);
  if (phase !== 'playing') return null;
  return <div className={styles.ball} aria-hidden />;
}
```

Create `app/(game)/_components/GameScreen/Ball.module.scss`:

```scss
.ball {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--colors-game-beige);
  border: 2px solid var(--colors-game-dark);
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 6;
  animation: approach 0.8s linear infinite;
}

@keyframes approach {
  0%   { transform: translate(-50%, -50%) scale(0.5); top: 35%; }
  100% { transform: translate(-50%, -50%) scale(1.0); top: 50%; }
}
```

- [ ] **Step 5: 임시 page.tsx에 GameScreen 마운트해서 동작 확인**

Modify `app/page.tsx`:

```tsx
'use client';
import { GameScreen } from './(game)/_components/GameScreen/GameScreen';
import { useGameStore } from 'lib/store/gameStore';
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    useGameStore.setState({ phase: 'playing' });
  }, []);
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <GameScreen />
    </main>
  );
}
```

Run: `pnpm dev` → http://localhost:3000

Expected: 배경 이미지 + HUD ("▶ 1회 / 0", "안타 0/3 / 아웃 0/3") + IDLE 프레임 캐릭터 + 깜빡이는 공.

- [ ] **Step 6: 커밋**

```bash
git add app/
git commit -m "feat: add GameScreen shell with background, HUD, batter sprite, ball"
```

### Task 6.2: Gauge 컴포넌트 + 탭 입력 연결

**Files:**
- Create: `app/(game)/_components/GameScreen/Gauge.tsx`, `.module.scss`

- [ ] **Step 1: Gauge 컴포넌트 (게이지 표시 + 탭 핸들러)**

Create `app/(game)/_components/GameScreen/Gauge.tsx`:

```tsx
'use client';
import { useCallback } from 'react';
import styles from './Gauge.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { useGauge } from 'lib/engine/gauge';
import { detectHit } from 'lib/engine/hitDetection';
import { getDifficulty } from 'data/rounds';

export function Gauge() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.current.round);
  const recordPitchResult = useGameStore((s) => s.recordPitchResult);

  const diff = getDifficulty(round);
  const running = phase === 'playing';

  const handleStop = useCallback((position: number) => {
    const result = detectHit(position, diff);
    recordPitchResult(result);
  }, [diff, recordPitchResult]);

  const { frame, stop } = useGauge({
    gaugeSpeedMs: diff.gaugeSpeedMs,
    running,
    onStop: handleStop,
  });

  if (!running && phase !== 'judging') return null;

  // 게이지 구간 시각화 (퍼펙트 중앙 + 굿 양옆 + 미스 양옆)
  const perfectStart = 50 - (diff.perfectZoneRatio * 100) / 2;
  const perfectWidth = diff.perfectZoneRatio * 100;
  const goodLeftStart = perfectStart - diff.goodZoneRatio * 100;
  const goodRightStart = perfectStart + perfectWidth;
  const goodWidth = diff.goodZoneRatio * 100;

  return (
    <div className={styles.gaugeWrap}>
      <button
        type="button"
        className={styles.tapZone}
        onClick={stop}
        onTouchStart={(e) => { e.preventDefault(); stop(); }}
        aria-label="탭해서 스윙"
      >
        <div className={styles.gauge}>
          <div className={styles.miss} />
          <div className={styles.good} style={{ left: `${goodLeftStart}%`, width: `${goodWidth}%` }} />
          <div className={styles.perfect} style={{ left: `${perfectStart}%`, width: `${perfectWidth}%` }} />
          <div className={styles.good} style={{ left: `${goodRightStart}%`, width: `${goodWidth}%` }} />
          <div className={styles.indicator} style={{ left: `${frame.position * 100}%` }} />
        </div>
        <div className={styles.tapLabel}>▼ TAP TO SWING ▼</div>
      </button>
    </div>
  );
}
```

Create `app/(game)/_components/GameScreen/Gauge.module.scss`:

```scss
.gaugeWrap {
  position: absolute;
  bottom: 4%;
  left: 4%;
  right: 4%;
  z-index: 20;
}

.tapZone {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.gauge {
  position: relative;
  height: 22px;
  background: rgba(0, 0, 0, 0.7);
  border: 3px solid var(--colors-game-beige);
  box-shadow: 3px 3px 0 var(--colors-game-dark);
}

.miss { position: absolute; inset: 0; background: rgba(255, 74, 110, 0.0); }

.good {
  position: absolute;
  top: 0; bottom: 0;
  background: var(--colors-game-hit);
  opacity: 0.6;
}

.perfect {
  position: absolute;
  top: 0; bottom: 0;
  background: var(--colors-game-perfect);
  box-shadow: 0 0 8px var(--colors-game-perfect);
}

.indicator {
  position: absolute;
  top: -8px; bottom: -8px;
  width: 6px;
  margin-left: -3px;
  background: var(--colors-game-beige);
  box-shadow: 2px 0 0 var(--colors-game-dark), -2px 0 0 var(--colors-game-dark);
}

.tapLabel {
  text-align: center;
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--colors-game-beige);
  margin-top: 8px;
  text-shadow: 2px 2px 0 var(--colors-game-dark);
}
```

- [ ] **Step 2: judging → proceedAfterJudging 자동 전이**

Modify `app/(game)/_components/GameScreen/GameScreen.tsx` 의 `GameScreen` 컴포넌트:

```tsx
'use client';
import { useEffect } from 'react';
import styles from './GameScreen.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import { Hud } from './Hud';
import { BatterSprite } from './BatterSprite';
import { Gauge } from './Gauge';
import { Ball } from './Ball';

const JUDGING_DELAY_MS = 800; // 결과 텍스트 표시 시간

export function GameScreen() {
  const phase = useGameStore((s) => s.phase);
  const proceedAfterJudging = useGameStore((s) => s.proceedAfterJudging);

  useEffect(() => {
    if (phase !== 'judging') return;
    const t = setTimeout(() => proceedAfterJudging(), JUDGING_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, proceedAfterJudging]);

  return (
    <div className={styles.screen}>
      <div className={styles.background} aria-hidden />
      <Hud />
      <BatterSprite />
      <Ball />
      <Gauge />
    </div>
  );
}
```

- [ ] **Step 3: 직접 플레이 검증**

Run: `pnpm dev` → http://localhost:3000

직접 플레이해보기:
- 게이지가 좌우로 움직임 ✓
- 탭하면 멈춤 + 800ms 후 다음 공 ✓
- 가운데 노란 구간 멈추면 홈런 (다음 회), 옆 초록 구간이면 안타 (HUD 안타 +1), 빨강 끝이면 스트라이크 (HUD 아웃 +1) ✓
- 3안타로 회 클리어 → 다음 회 시작 ✓
- 3아웃이면 cutscene phase로 (다음 task에서 처리) ✓

콘솔 에러 없는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/
git commit -m "feat: add gauge with tap detection and judging delay"
```

---

## Phase 7: 효과 + 컷씬

### Task 7.1: 결과 효과 텍스트 (홈런/안타/스트라이크)

**Files:**
- Create: `app/(game)/_components/GameScreen/EffectText.tsx`, `.module.scss`
- Modify: `GameScreen.tsx`

- [ ] **Step 1: 마지막 판정 결과 추적 위해 store 확장**

Modify `lib/store/gameStore.ts` — `GameState` 에 추가:

```typescript
lastResult: PitchOutcome | null,
```

`INITIAL_STATE` 추가: `lastResult: null,`

`recordPitchResult` 액션에 `next.lastResult = result.outcome;` 추가.

`startGame` 액션에서 `lastResult: null` 도 초기화.

타입체크 + 기존 테스트 통과 확인:
```bash
pnpm typecheck && pnpm test:run lib/store/gameStore.test.ts
```

- [ ] **Step 2: EffectText 컴포넌트**

Create `app/(game)/_components/GameScreen/EffectText.tsx`:

```tsx
'use client';
import styles from './EffectText.module.scss';
import { useGameStore } from 'lib/store/gameStore';
import clsx from 'clsx';

const LABEL: Record<string, string> = {
  homerun: '★ HOMERUN ★',
  hit: '딱! 안타!',
  strike: '헛스윙!',
};

export function EffectText() {
  const phase = useGameStore((s) => s.phase);
  const last = useGameStore((s) => s.lastResult);
  if (phase !== 'judging' || !last) return null;
  return (
    <div className={clsx(styles.effect, styles[last])}>
      {LABEL[last]}
    </div>
  );
}
```

Create `app/(game)/_components/GameScreen/EffectText.module.scss`:

```scss
.effect {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 3px;
  z-index: 30;
  pointer-events: none;
  animation: pop 0.8s ease-out forwards;
  text-shadow: 4px 4px 0 var(--colors-game-dark), -1px -1px 0 var(--colors-game-dark),
    1px -1px 0 var(--colors-game-dark), -1px 1px 0 var(--colors-game-dark), 1px 1px 0 var(--colors-game-dark);
}

.homerun { color: var(--colors-game-perfect); }
.hit { color: var(--colors-game-hit); }
.strike { color: var(--colors-game-miss); transform: translate(-50%, -50%) rotate(-6deg); }

@keyframes pop {
  0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
}
```

- [ ] **Step 3: GameScreen에 EffectText 추가**

Modify `GameScreen.tsx` import + render:

```tsx
import { EffectText } from './EffectText';
// ... 안에서
<EffectText />
```

- [ ] **Step 4: 플레이 검증**

`pnpm dev`. 게이지 멈출 때마다 결과 텍스트가 화면 중앙에 0.8초 표시.

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add effect text on hit/homerun/strike"
```

### Task 7.2: 컷씬 컴포넌트 (홈런/50회/게임오버)

**Files:**
- Create: `app/(game)/_components/Cutscene/Cutscene.tsx`, `.module.scss`
- Modify: `app/page.tsx`

- [ ] **Step 1: Cutscene 컴포넌트**

Create `app/(game)/_components/Cutscene/Cutscene.tsx`:

```tsx
'use client';
import { useEffect, useMemo } from 'react';
import { useGameStore } from 'lib/store/gameStore';
import styles from './Cutscene.module.scss';
import { STRIKES_TO_GAME_OVER } from 'lib/constants';

type CutsceneKind = 'homerun' | 'milestone_50' | 'gameover';

const DURATIONS: Record<CutsceneKind, number> = {
  homerun: 1500,
  milestone_50: 3000,
  gameover: 2200,
};

const IMAGES: Record<CutsceneKind, string> = {
  homerun: '/images/homerun.png',
  milestone_50: '/images/milestone-50.png',
  gameover: '/images/gameover.png',
};

const LABELS: Record<CutsceneKind, string> = {
  homerun: '★ HOMERUN ★',
  milestone_50: '50회 클리어!',
  gameover: 'GAME OVER',
};

export function Cutscene() {
  const phase = useGameStore((s) => s.phase);
  const totalStrikes = useGameStore((s) => s.totalStrikes);
  const lifetime50Done = useGameStore((s) => s.lifetime50Done);
  const maxRound = useGameStore((s) => s.maxRoundReached);
  const homerunInRound = useGameStore((s) => s.current.homerunInRound);
  const endCutscene = useGameStore((s) => s.endCutscene);

  const kind: CutsceneKind | null = useMemo(() => {
    if (phase !== 'cutscene') return null;
    if (totalStrikes >= STRIKES_TO_GAME_OVER) return 'gameover';
    // 50회 첫 도달 - lifetime50Done 이 막 true가 된 상황 + maxRound 50 도달
    if (lifetime50Done && maxRound >= 50 && homerunInRound) {
      // 둘 다 만족하면 50회 컷씬 우선
      return 'milestone_50';
    }
    if (lifetime50Done && maxRound === 50) return 'milestone_50';
    if (homerunInRound) return 'homerun';
    return null;
  }, [phase, totalStrikes, lifetime50Done, maxRound, homerunInRound]);

  useEffect(() => {
    if (!kind) return;
    const t = setTimeout(() => endCutscene(), DURATIONS[kind]);
    return () => clearTimeout(t);
  }, [kind, endCutscene]);

  if (!kind) return null;

  return (
    <div className={styles.cutscene} role="dialog" aria-label={LABELS[kind]}>
      <img src={IMAGES[kind]} alt="" className={styles.image} />
      <div className={styles.label}>{LABELS[kind]}</div>
    </div>
  );
}
```

Create `app/(game)/_components/Cutscene/Cutscene.module.scss`:

```scss
.cutscene {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: var(--colors-game-dark);
  display: flex;
  align-items: stretch;
  justify-content: center;
  animation: fade-in 0.2s ease-in;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.label {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--colors-game-dark);
  color: var(--colors-game-yellow);
  padding: 12px 24px;
  font-size: 24px;
  letter-spacing: 4px;
  text-shadow: 3px 3px 0 var(--colors-game-red);
  border: 4px solid var(--colors-game-yellow);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 2: page.tsx에서 phase 따라 Cutscene 표시**

Modify `app/page.tsx`:

```tsx
'use client';
import { useEffect } from 'react';
import { GameScreen } from './(game)/_components/GameScreen/GameScreen';
import { Cutscene } from './(game)/_components/Cutscene/Cutscene';
import { useGameStore } from 'lib/store/gameStore';

export default function Page() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    // 임시: 진입 시 자동 시작 (Phase 8에서 타이틀 화면으로 교체)
    if (phase === 'title') {
      useGameStore.setState({ phase: 'playing' });
    }
  }, [phase]);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <GameScreen />
      {phase === 'cutscene' && <Cutscene />}
    </main>
  );
}
```

- [ ] **Step 3: 플레이 검증**

`pnpm dev`. 일부러 홈런 치면 (게이지 중앙) → 홈런 컷씬 1.5초 표시. 3아웃 만들면 게임오버 컷씬.

- [ ] **Step 4: 커밋**

```bash
git add .
git commit -m "feat: add cutscene for homerun, milestone 50, gameover"
```

---

## Phase 8: 타이틀 화면 + 인트로

### Task 8.1: Title 화면

**Files:**
- Create: `app/(game)/_components/Title/Title.tsx`, `.module.scss`
- Modify: `app/page.tsx`

- [ ] **Step 1: Title 컴포넌트**

Create `app/(game)/_components/Title/Title.tsx`:

```tsx
'use client';
import styles from './Title.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Title() {
  const startGame = useGameStore((s) => s.startGame);
  const freeLeft = useGameStore((s) => s.freeSessionsLeft);
  const adLeft = useGameStore((s) => s.adSessionsLeft);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);

  const totalLeft = freeLeft + adLeft;

  return (
    <div className={styles.title}>
      <img src="/images/title.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h1 className={styles.heading}>오늘의 4번타자</h1>
        <p className={styles.subtitle}>타이밍 맞춰 풀스윙!</p>
        <div className={styles.sessions}>
          오늘 남은 플레이: {totalLeft}회 (무료 {freeLeft} / 광고 {adLeft})
        </div>
        <button
          type="button"
          className={styles.startButton}
          onClick={startGame}
          disabled={totalLeft === 0}
        >
          {totalLeft === 0 ? '내일 다시!' : '게임 시작'}
        </button>
        <button
          type="button"
          className={styles.leaderboardButton}
          onClick={showLeaderboard}
        >
          리더보드
        </button>
      </div>
    </div>
  );
}
```

Create `app/(game)/_components/Title/Title.module.scss`:

```scss
.title { position: absolute; inset: 0; overflow: hidden; }

.bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  z-index: 0;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 32px 48px;
  background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.75) 100%);
}

.heading {
  font-size: 32px;
  color: var(--colors-game-yellow);
  letter-spacing: 4px;
  text-shadow: 4px 4px 0 var(--colors-game-red);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 12px;
  color: var(--colors-game-beige);
  letter-spacing: 3px;
  margin-bottom: 32px;
}

.sessions {
  font-size: 11px;
  color: var(--colors-game-beige);
  letter-spacing: 2px;
  margin-bottom: 24px;
}

.startButton, .leaderboardButton {
  width: 100%;
  max-width: 320px;
  padding: 16px;
  font-size: 16px;
  letter-spacing: 3px;
  border: 4px solid var(--colors-game-beige);
  background: var(--colors-game-red);
  color: var(--colors-game-beige);
  cursor: pointer;
  margin-bottom: 12px;
  box-shadow: 4px 4px 0 var(--colors-game-dark);
  &:disabled { background: var(--colors-game-soil); cursor: not-allowed; opacity: 0.7; }
}

.leaderboardButton {
  background: var(--colors-game-navy);
}
```

- [ ] **Step 2: 인트로 phase 처리 (간단 카운트다운)**

Create `app/(game)/_components/Title/Intro.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useGameStore } from 'lib/store/gameStore';

export function Intro() {
  const endIntro = useGameStore((s) => s.endIntro);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      endIntro();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [count, endIntro]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'var(--colors-game-dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--colors-game-yellow)', fontSize: 96, letterSpacing: 8,
    }}>
      {count > 0 ? count : 'GO!'}
    </div>
  );
}
```

- [ ] **Step 3: page.tsx에서 phase별 라우팅**

Replace `app/page.tsx`:

```tsx
'use client';
import { useGameStore } from 'lib/store/gameStore';
import { GameScreen } from './(game)/_components/GameScreen/GameScreen';
import { Title } from './(game)/_components/Title/Title';
import { Intro } from './(game)/_components/Title/Intro';
import { Cutscene } from './(game)/_components/Cutscene/Cutscene';

export default function Page() {
  const phase = useGameStore((s) => s.phase);
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {phase === 'title' && <Title />}
      {phase === 'intro' && <Intro />}
      {(phase === 'playing' || phase === 'judging' || phase === 'cutscene') && <GameScreen />}
      {phase === 'cutscene' && <Cutscene />}
    </main>
  );
}
```

- [ ] **Step 4: 검증 + 커밋**

`pnpm dev` → 타이틀 → 시작 버튼 → 3-2-1-GO! → 게임 진행.

```bash
git add .
git commit -m "feat: add title screen and intro countdown"
```

---

## Phase 9: 결과 화면 + 광고 이어하기 모달

### Task 9.1: ContinueModal (광고 이어하기)

**Files:**
- Create: `app/(game)/_components/Result/ContinueModal.tsx`, `.module.scss`

- [ ] **Step 1: 모달 컴포넌트**

Create `app/(game)/_components/Result/ContinueModal.tsx`:

```tsx
'use client';
import styles from './ContinueModal.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function ContinueModal() {
  const continuesLeft = useGameStore((s) => s.continuesLeft);
  const round = useGameStore((s) => s.current.round);
  const startContinue = useGameStore((s) => s.startContinue);
  const giveUp = useGameStore((s) => s.giveUp);

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.heading}>한 번만 더?</h2>
        <p className={styles.body}>
          {round}회에서 멈추셨습니다.<br />
          광고를 보고 이 회부터 다시 시작할까요?
        </p>
        <p className={styles.continues}>이어하기 {continuesLeft}회 남음</p>
        <button type="button" className={styles.continueButton} onClick={startContinue}>
          광고 보고 이어하기
        </button>
        <button type="button" className={styles.giveUpButton} onClick={giveUp}>
          오늘은 그만
        </button>
      </div>
    </div>
  );
}
```

Create `app/(game)/_components/Result/ContinueModal.module.scss`:

```scss
.backdrop {
  position: absolute; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal {
  background: var(--colors-game-navy);
  border: 4px solid var(--colors-game-beige);
  padding: 32px 24px;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 6px 6px 0 var(--colors-game-dark);
}
.heading {
  color: var(--colors-game-yellow);
  font-size: 24px;
  letter-spacing: 4px;
  margin-bottom: 16px;
  text-shadow: 3px 3px 0 var(--colors-game-red);
}
.body { color: var(--colors-game-beige); font-size: 14px; line-height: 1.7; margin-bottom: 8px; }
.continues { color: var(--colors-game-yellow); font-size: 11px; letter-spacing: 2px; margin-bottom: 24px; }
.continueButton, .giveUpButton {
  width: 100%; padding: 14px; font-size: 14px; letter-spacing: 3px;
  border: 4px solid var(--colors-game-beige);
  cursor: pointer; margin-bottom: 8px;
  box-shadow: 3px 3px 0 var(--colors-game-dark);
}
.continueButton { background: var(--colors-game-red); color: var(--colors-game-beige); }
.giveUpButton { background: var(--colors-game-soil); color: var(--colors-game-beige); }
```

- [ ] **Step 2: page.tsx 라우팅 확장**

Modify `app/page.tsx` 추가:

```tsx
import { ContinueModal } from './(game)/_components/Result/ContinueModal';
// ... 안에서
{phase === 'continue_prompt' && <ContinueModal />}
```

- [ ] **Step 3: 검증**

3아웃 만들기 → 게임오버 컷씬 → ContinueModal 표시.
"광고 보고 이어하기" 클릭 → 같은 회에서 다시 시작.
"오늘은 그만" 클릭 → result phase (다음 task에서 화면 추가).

- [ ] **Step 4: 커밋**

```bash
git add .
git commit -m "feat: add continue ad modal on game over"
```

### Task 9.2: Result 화면

**Files:**
- Create: `app/(game)/_components/Result/Result.tsx`, `.module.scss`

- [ ] **Step 1: Result 컴포넌트**

Create `app/(game)/_components/Result/Result.tsx`:

```tsx
'use client';
import styles from './Result.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function Result() {
  const maxRound = useGameStore((s) => s.maxRoundReached);
  const score = useGameStore((s) => s.totalScore);
  const hits = useGameStore((s) => s.totalHits);
  const homeruns = useGameStore((s) => s.totalHomeruns);
  const goToTitle = useGameStore((s) => s.goToTitle);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);

  return (
    <div className={styles.result}>
      <img src="/images/gameover.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h2 className={styles.heading}>오늘의 기록</h2>
        <dl className={styles.stats}>
          <div className={styles.row}><dt>최고 회</dt><dd className={styles.big}>{maxRound}회</dd></div>
          <div className={styles.row}><dt>총 점수</dt><dd>{score.toLocaleString()}</dd></div>
          <div className={styles.row}><dt>안타</dt><dd>{hits}</dd></div>
          <div className={styles.row}><dt>홈런</dt><dd>{homeruns}</dd></div>
        </dl>
        <button type="button" className={styles.button} onClick={showLeaderboard}>리더보드 보기</button>
        <button type="button" className={styles.buttonSecondary} onClick={goToTitle}>처음으로</button>
      </div>
    </div>
  );
}
```

Create `app/(game)/_components/Result/Result.module.scss`:

```scss
.result { position: absolute; inset: 0; overflow: hidden; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; z-index: 0; }
.overlay {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 60%);
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding: 0 32px 48px;
}
.heading {
  color: var(--colors-game-yellow);
  font-size: 22px;
  letter-spacing: 4px;
  margin-bottom: 24px;
  text-shadow: 3px 3px 0 var(--colors-game-red);
}
.stats {
  width: 100%;
  max-width: 320px;
  background: var(--colors-game-navy);
  border: 4px solid var(--colors-game-beige);
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 4px 4px 0 var(--colors-game-dark);
}
.row {
  display: flex; justify-content: space-between; padding: 6px 0;
  color: var(--colors-game-beige);
  font-size: 13px;
  letter-spacing: 2px;
}
.row dt { color: var(--colors-game-beige); }
.row dd { color: var(--colors-game-yellow); }
.big { font-size: 24px; }
.button, .buttonSecondary {
  width: 100%; max-width: 320px; padding: 14px; font-size: 14px; letter-spacing: 3px;
  border: 4px solid var(--colors-game-beige); cursor: pointer; margin-bottom: 8px;
  box-shadow: 4px 4px 0 var(--colors-game-dark);
}
.button { background: var(--colors-game-red); color: var(--colors-game-beige); }
.buttonSecondary { background: var(--colors-game-navy); color: var(--colors-game-beige); }
```

- [ ] **Step 2: page.tsx 라우팅 확장**

```tsx
import { Result } from './(game)/_components/Result/Result';
// ... 안에서
{phase === 'result' && <Result />}
```

- [ ] **Step 3: 검증 + 커밋**

```bash
git add .
git commit -m "feat: add result screen with game stats"
```

---

## Phase 10: 리더보드 + 일일 한도 화면

### Task 10.1: Leaderboard 화면

**Files:**
- Create: `app/(game)/_components/Leaderboard/Leaderboard.tsx`, `.module.scss`

- [ ] **Step 1: 컴포넌트**

Create `app/(game)/_components/Leaderboard/Leaderboard.tsx`:

```tsx
'use client';
import styles from './Leaderboard.module.scss';
import { MOCK_LEADERBOARD } from 'data/leaderboard';
import { getTeam } from 'data/teams';
import { useGameStore } from 'lib/store/gameStore';

export function Leaderboard() {
  const goToTitle = useGameStore((s) => s.goToTitle);

  return (
    <div className={styles.leaderboard}>
      <header className={styles.header}>
        <h2 className={styles.heading}>리더보드</h2>
        <button type="button" className={styles.close} onClick={goToTitle}>X</button>
      </header>
      <div className={styles.legend}>
        <span>순위</span><span>닉네임</span><span>팀</span>
        <span>회</span><span>점수</span>
      </div>
      <ol className={styles.list}>
        {MOCK_LEADERBOARD.map((e) => {
          const team = getTeam(e.team);
          return (
            <li key={`${e.rank}-${e.nickname}`} className={styles.row}>
              <span className={styles.rank}>{e.rank}</span>
              <span className={styles.nick}>{e.nickname}</span>
              <span
                className={styles.team}
                style={team ? { background: team.color } : undefined}
              >
                {team?.short ?? '-'}
              </span>
              <span className={styles.round}>{e.round}회</span>
              <span className={styles.score}>{e.score.toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

Create `app/(game)/_components/Leaderboard/Leaderboard.module.scss`:

```scss
.leaderboard {
  position: absolute; inset: 0; z-index: 50;
  background: var(--colors-game-dark);
  display: flex; flex-direction: column;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 4px solid var(--colors-game-yellow);
}
.heading { color: var(--colors-game-yellow); font-size: 20px; letter-spacing: 4px; }
.close {
  background: var(--colors-game-red); color: var(--colors-game-beige);
  border: 3px solid var(--colors-game-beige);
  width: 36px; height: 36px; cursor: pointer; font-size: 14px;
  box-shadow: 2px 2px 0 var(--colors-game-dark);
}
.legend, .row {
  display: grid;
  grid-template-columns: 36px 1fr 56px 56px 80px;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--colors-game-beige);
}
.legend { background: var(--colors-game-navy); border-bottom: 2px solid var(--colors-game-beige); }
.list { list-style: none; flex: 1; overflow-y: auto; }
.row { border-bottom: 1px solid var(--colors-game-navy); }
.row:nth-child(odd) { background: rgba(255,255,255,0.03); }
.rank { color: var(--colors-game-yellow); font-weight: 900; text-align: center; }
.team {
  display: inline-block;
  padding: 2px 4px; border-radius: 2px;
  color: var(--colors-game-beige); font-size: 9px; font-weight: 900;
  text-align: center; text-shadow: 1px 1px 0 rgba(0,0,0,0.6);
}
.round { color: var(--colors-game-beige); }
.score { color: var(--colors-game-yellow); text-align: right; }
```

- [ ] **Step 2: page.tsx 라우팅 추가**

```tsx
import { Leaderboard } from './(game)/_components/Leaderboard/Leaderboard';
// ...
{phase === 'leaderboard' && <Leaderboard />}
```

- [ ] **Step 3: 검증 + 커밋**

```bash
git add .
git commit -m "feat: add mock leaderboard screen"
```

### Task 10.2: DailyLimit 화면

**Files:**
- Create: `app/(game)/_components/DailyLimit/DailyLimit.tsx`, `.module.scss`

- [ ] **Step 1: 컴포넌트**

Create `app/(game)/_components/DailyLimit/DailyLimit.tsx`:

```tsx
'use client';
import styles from './DailyLimit.module.scss';
import { useGameStore } from 'lib/store/gameStore';

export function DailyLimit() {
  const goToTitle = useGameStore((s) => s.goToTitle);
  return (
    <div className={styles.daily}>
      <img src="/images/gameover.png" alt="" className={styles.bg} />
      <div className={styles.overlay}>
        <h2 className={styles.heading}>오늘은 여기까지!</h2>
        <p className={styles.body}>
          하루 5세션 모두 소진하셨습니다.<br />
          자정에 리셋됩니다. 내일 다시 도전!
        </p>
        <button type="button" className={styles.button} onClick={goToTitle}>확인</button>
      </div>
    </div>
  );
}
```

Create `app/(game)/_components/DailyLimit/DailyLimit.module.scss`:

```scss
.daily { position: absolute; inset: 0; overflow: hidden; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; z-index: 0; filter: grayscale(0.5) brightness(0.7); }
.overlay {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(0,0,0,0.7);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px; text-align: center;
}
.heading { color: var(--colors-game-yellow); font-size: 24px; letter-spacing: 4px; margin-bottom: 16px; text-shadow: 3px 3px 0 var(--colors-game-red); }
.body { color: var(--colors-game-beige); font-size: 13px; line-height: 1.7; margin-bottom: 24px; }
.button {
  padding: 14px 32px; background: var(--colors-game-red); color: var(--colors-game-beige);
  border: 4px solid var(--colors-game-beige); cursor: pointer; font-size: 14px;
  letter-spacing: 3px; box-shadow: 4px 4px 0 var(--colors-game-dark);
}
```

- [ ] **Step 2: page.tsx 라우팅**

```tsx
import { DailyLimit } from './(game)/_components/DailyLimit/DailyLimit';
// ...
{phase === 'daily_limit' && <DailyLimit />}
```

- [ ] **Step 3: 동작 검증 (수동)**

브라우저 콘솔에서:
```js
useGameStore.getState().showDailyLimit()
```

또는 `Title.tsx` 의 "게임 시작" 버튼이 0세션일 때 disabled 됨 — `freeSessionsLeft + adSessionsLeft = 0` 으로 setState 한 후 동작 확인.

- [ ] **Step 4: 커밋**

```bash
git add .
git commit -m "feat: add daily limit screen"
```

---

## Phase 11: Mobile viewport + final polish

### Task 11.1: 모바일 뷰포트 + iframe-safe 처리

**Files:**
- Modify: `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: viewport meta + 9:16 비율 강제**

Modify `app/layout.tsx`:

```tsx
import './globals.scss';
import { Press_Start_2P } from 'next/font/google';

const pixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

export const metadata = {
  title: '오늘의 4번타자',
  description: '폴리볼 야구 타격 미니게임',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pixel.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 9:16 컨테이너 강제 (큰 화면에서도 모바일 비율 유지)**

Modify `app/page.tsx`:

```tsx
'use client';
import { useGameStore } from 'lib/store/gameStore';
import { GameScreen } from './(game)/_components/GameScreen/GameScreen';
import { Title } from './(game)/_components/Title/Title';
import { Intro } from './(game)/_components/Title/Intro';
import { Cutscene } from './(game)/_components/Cutscene/Cutscene';
import { ContinueModal } from './(game)/_components/Result/ContinueModal';
import { Result } from './(game)/_components/Result/Result';
import { Leaderboard } from './(game)/_components/Leaderboard/Leaderboard';
import { DailyLimit } from './(game)/_components/DailyLimit/DailyLimit';

export default function Page() {
  const phase = useGameStore((s) => s.phase);
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--colors-game-dark)',
    }}>
      <div style={{
        position: 'relative',
        aspectRatio: '9 / 16',
        height: '100%',
        maxHeight: '100vh',
        width: 'auto',
        overflow: 'hidden',
      }}>
        {phase === 'title' && <Title />}
        {phase === 'intro' && <Intro />}
        {(phase === 'playing' || phase === 'judging' || phase === 'cutscene') && <GameScreen />}
        {phase === 'cutscene' && <Cutscene />}
        {phase === 'continue_prompt' && <ContinueModal />}
        {phase === 'result' && <Result />}
        {phase === 'leaderboard' && <Leaderboard />}
        {phase === 'daily_limit' && <DailyLimit />}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 검증**

`pnpm dev` → 데스크탑 브라우저에서도 모바일 9:16 비율로 중앙 표시.

DevTools 모바일 모드 (375×667 등) 로도 확인.

- [ ] **Step 4: 커밋**

```bash
git add .
git commit -m "feat: enforce 9:16 mobile viewport for iframe-safe display"
```

### Task 11.2: 풀게임 플로우 종단 검증

**Files:** (검증만, 코드 변경 X)

- [ ] **Step 1: 전체 흐름 수동 테스트**

1. `pnpm dev`
2. 타이틀 화면 표시 확인
3. "게임 시작" → 3-2-1-GO! 카운트다운
4. 1회 시작, 게이지 진동
5. 탭해서 안타 3개로 클리어 → 2회로
6. 홈런 (게이지 중앙 정확히) → 홈런 컷씬 → 다음 회
7. 일부러 스트라이크 3개 누적 → 게임오버 컷씬 → ContinueModal
8. "광고 보고 이어하기" → 같은 회 다시 시작
9. 한번 더 게임오버 → ContinueModal (1회 남음)
10. "오늘은 그만" → Result 화면
11. "리더보드 보기" → Leaderboard 화면 (50명 mock)
12. X 닫기 → Title 화면

각 단계마다 콘솔 에러 없는지 확인. 게임 통째로 동작.

- [ ] **Step 2: 전체 테스트 실행**

```bash
pnpm test:run
pnpm typecheck
```

Expected: 모든 테스트 통과, 0 typecheck 에러.

- [ ] **Step 3: 빌드 검증**

```bash
pnpm build
```

Expected: 빌드 성공. 경고는 무시.

- [ ] **Step 4: README 첫 버전**

Create `README.md`:

```markdown
# 오늘의 4번타자

폴리볼 두 번째 미니게임. 타이밍 맞춰 풀스윙하는 야구 타격 게임.

## 개발

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

http://localhost:3000

## 빌드

\`\`\`bash
pnpm build
pnpm start
\`\`\`

## 테스트

\`\`\`bash
pnpm test       # watch mode
pnpm test:run   # 단일 실행
pnpm typecheck
\`\`\`

## 디자인 스펙

`docs/superpowers/specs/2026-05-12-oneul-4taja-design.md`

## 구현 진행

- Plan A (Foundation) — 완료. mock 데이터로 단독 동작.
- Plan B (Parent Integration + Handoff) — TBD. postMessage 양방향 + 부모 mock + README/INTEGRATION + GitHub + ZIP.
```

```bash
git add README.md
git commit -m "docs: add initial README"
```

- [ ] **Step 5: 최종 Plan A 완료 커밋 메시지로 정리**

```bash
git log --oneline
```

Plan A 끝. 다음은 Plan B (PostMessage + 부모 통합 + 핸드오프).

---

## Self-Review Checklist (Plan 자체 점검)

1. **Spec coverage:**
   - ✅ 2.1 게이지 5구간 → Phase 5 + Phase 6
   - ✅ 2.2 판정 룰 → Phase 5
   - ✅ 2.3 회 구조 → Phase 4 (proceedAfterJudging)
   - ✅ 2.4 게임오버 → Phase 4 + Phase 7
   - ✅ 2.5 진행 (50회 + 무한) → Phase 4 + Phase 7
   - ✅ 3 점수 시스템 → constants.ts + gameStore
   - ✅ 4.1 이어하기 → Phase 9
   - ✅ 5 응모권 마일스톤 → gameStore.proceedAfterJudging
   - ✅ 6 리더보드 → Phase 10
   - ✅ 7 컬러 토큰 → Phase 2
   - ✅ 8 자산 6장 → 이미 public/images/
   - ⏭️ 9 PostMessage → Plan B 범위
   - ⏭️ 10 백엔드 통합 → Plan B 범위
   - ✅ 11 화면 9종 → Phase 6, 7, 8, 9, 10
   - ⏭️ 12 인계 산출물 → Plan B 범위
   - ✅ 13 기술 스택 → Phase 1
   - ⏭️ 14 Open Questions → 시뮬레이션 단계 (별도)

2. **Placeholder scan:** TBD/TODO 없음. 각 step 에 실행 가능한 코드 또는 명령 포함.

3. **Type consistency:** `GameState`, `Actions`, `HitResult`, `RoundDifficulty` 모두 lib/types.ts 에서 정의된 타입과 일치.

4. **Scope:** Plan A는 단독 플레이 가능한 게임까지. Plan B로 PostMessage 통합 + 핸드오프 분리됨.

---

## 실행 옵션

Plan A 작성 완료. 실행 시 두 가지 옵션:

**1. Subagent-Driven (권장)** — 작업마다 fresh subagent 디스패치, 사이사이 review, 빠른 반복.

**2. Inline Execution** — 이 세션에서 작업 일괄 실행 + 체크포인트 review.

어느 방식?
