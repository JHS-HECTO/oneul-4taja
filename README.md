# 오늘의 4번타자

폴리볼 두 번째 미니게임. 타이밍 맞춰 풀스윙하는 야구 타격 게임.

**상태:** Plan A 완료 — mock 데이터로 단독 플레이 가능. 부모 통합/핸드오프(Plan B)는 별도 작업.

## 빠른 시작

```bash
pnpm install
pnpm dev
```

http://localhost:3000 — 9:16 모바일 비율 (큰 화면에서도 모바일처럼 표시).

## 플레이 흐름

```
타이틀 → "게임 시작" → 3-2-1-GO 인트로 → 게임 화면
  → 게이지 좌우 진동 → 탭으로 정지
  → 퍼펙트존(중앙) = 홈런 → 즉시 다음 회 (컷씬 1.5s)
  → 굿존(양옆 초록) = 안타 → 회 누적 안타 +1
  → 미스존(끝) = 스트라이크 → 게임 누적 아웃 +1
  → 안타 3 또는 홈런 1 → 회 클리어, 다음 회
  → 누적 아웃 3 → 게임오버 컷씬
  → 이어하기 모달 (광고 시청 → 이 회부터 다시, 스트라이크/안타 0 리셋)
  → 거절 시 결과 화면 → 리더보드 (mock 50명) → 타이틀
```

50회 첫 도달 시 평생 마일스톤 컷씬 1회 노출, 51회+ 무한 모드 (난이도 평형).

## 기술 스택

- Next.js 16.2.6 (App Router, Turbopack)
- React 19.2.6
- TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- SCSS Modules + CSS 변수 토큰 (NES Classic 픽셀 팔레트)
- zustand (게임 상태)
- Press Start 2P 픽셀 폰트 (`next/font/google`)
- vitest + @testing-library/react (단위테스트)

## 디자인 톤

8bit NES Classic 픽셀아트.

| 토큰 | hex | 용도 |
|---|---|---|
| `--colors-game-grass` | `#2c8930` | 잔디 |
| `--colors-game-soil` | `#8b4513` | 흙 / 다이아몬드 |
| `--colors-game-red` | `#d62828` | 유니폼 / 강조 |
| `--colors-game-yellow` | `#ffc83d` | 효과 / 점수 |
| `--colors-game-beige` | `#f2e8c9` | 텍스트 / 베이스 |
| `--colors-game-sky` | `#87ceeb` | 하늘 |
| `--colors-game-dark` | `#1a1a1a` | 윤곽선 / 그림자 |

## 자산 (Gemini 생성)

`public/images/` 에 6장:

```
title.png        720×1280  타이틀 화면 일러스트
background.png   720×1280  인게임 풀스크린 배경
batter-sprite.png 2320×416  5프레임 sprite sheet (idle/swing_wind/swing_contact/homerun/strikeout)
homerun.png      720×1280  홈런 컷씬
gameover.png     720×1280  게임오버 컷씬
milestone-50.png 720×1280  50회 첫 클리어 축하 컷씬
```

각 이미지의 Gemini 프롬프트는 `docs/superpowers/specs/2026-05-12-oneul-4taja-design.md` 8.2 절 참조.

## 디렉토리 구조

```
오늘의-4번타자/
├── app/
│   ├── layout.tsx         — 폰트 + 메타
│   ├── page.tsx           — 메인 라우트 (phase별 화면 라우팅)
│   └── globals.scss       — CSS 변수 + 픽셀 폰트 + 리셋
├── components/
│   ├── Title/             — Title.tsx, Intro.tsx
│   ├── GameScreen/        — GameScreen.tsx, Hud.tsx, BatterSprite.tsx, Ball.tsx, Gauge.tsx, EffectText.tsx
│   ├── Cutscene/          — Cutscene.tsx (homerun/50회/gameover)
│   ├── Result/            — Result.tsx, ContinueModal.tsx
│   ├── Leaderboard/       — Leaderboard.tsx
│   └── DailyLimit/        — DailyLimit.tsx
├── lib/
│   ├── types.ts           — 게임 상태 / 회 / 히트 / 리더보드 타입
│   ├── constants.ts       — 점수 / 일일 정책 / 회 규칙 / 컷씬 타이밍
│   ├── store/
│   │   ├── gameStore.ts   — zustand store (전체 상태 머신)
│   │   └── gameStore.test.ts
│   └── engine/
│       ├── gauge.ts       — 게이지 진동 (computeGaugePosition + useGauge hook)
│       ├── gauge.test.ts
│       ├── hitDetection.ts — 게이지 위치 → 결과 판정
│       └── hitDetection.test.ts
├── data/
│   ├── teams.ts           — KBO 9팀 mock
│   ├── rounds.ts          — 1~50회 난이도 곡선 (51+ 평형)
│   ├── rounds.test.ts
│   ├── leaderboard.ts     — 50명 mock entries
│   └── leaderboard.test.ts
├── public/images/         — Gemini 자산 6장
└── docs/superpowers/
    ├── specs/2026-05-12-oneul-4taja-design.md   — 디자인 스펙
    └── plans/2026-05-12-foundation.md            — Plan A 구현 계획
```

## 명령어

```bash
pnpm install      # 의존성 설치 (mirror 사용: registry.npmmirror.com)
pnpm dev          # 개발 서버 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm start        # 빌드된 서버 실행
pnpm test         # vitest watch 모드
pnpm test:run     # 단발 실행
pnpm typecheck    # TypeScript 타입체크
```

## 테스트 커버리지

48 unit tests 통과:
- `data/rounds.test.ts` — 5 tests (난이도 곡선)
- `data/leaderboard.test.ts` — 4 tests (mock 데이터)
- `lib/engine/gauge.test.ts` — 6 tests (게이지 계산)
- `lib/engine/hitDetection.test.ts` — 10 tests (히트 판정)
- `lib/store/gameStore.test.ts` — 23 tests (상태 전이)

## 다음 (Plan B)

- PostMessage 양방향 프로토콜 (`CLEANUP:PLAY_AD`, `CLEANUP:TICKET_REWARD`, `CLEANUP:GAME_OVER`, `CLEANUP:USER_INFO`, `CLEANUP:AD_COMPLETED`, etc.)
- 부모 mock 페이지 (개발팀 통합 검증용)
- `INTEGRATION.md` (백엔드 통합 명세)
- `server-spec.html` (서버 기획서)
- GitHub 저장소 + Vercel 프리뷰
- 핸드오프 ZIP 패키지

## 참고

- 디자인 스펙: `docs/superpowers/specs/2026-05-12-oneul-4taja-design.md`
- Plan A 상세: `docs/superpowers/plans/2026-05-12-foundation.md`
- 시리즈 첫 게임: `야구빠따 키우기` — [JHS-HECTO/yagu-bbada](https://github.com/JHS-HECTO/yagu-bbada)
