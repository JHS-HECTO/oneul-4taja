# 오늘의 4번타자 — 디자인 스펙

**작성일**: 2026-05-12
**프로젝트**: 폴리볼 두 번째 미니게임
**시리즈**: 야구빠따 키우기에 이은 라인업 두 번째
**상태**: 브레인스토밍 완료 → 구현 계획 작성 대기

---

## 0. 한 줄 요약

타이밍 게이지를 정확한 순간에 멈춰 공을 치는 야구 타격 미니게임. 회(回) 단위로 진행하며 회마다 5구 중 3안타로 클리어, 누적 3스트라이크면 게임오버. 50회 + 무한 모드.

---

## 1. 기본 정보

| 항목 | 값 |
|---|---|
| 정식 명칭 | 오늘의 4번타자 |
| 단축 명칭 | 4번타자 |
| postMessage prefix | `CLEANUP` |
| 장르 | 타이밍 / 단계 클리어 |
| 1세션 길이 | 30초 ~ 2분 (실력 따라) |
| 타겟 | 폴리볼 유저 (한국 야구팬) |

---

## 2. 핵심 메커니즘

### 2.1 게이지 / 타이밍

좌우 슬라이딩 게이지. 5구간으로 분할:

```
[ 미스 ][ 굿 ][ 퍼펙트 ][ 굿 ][ 미스 ]
```

- 게이지가 좌우로 왕복
- 유저 탭 → 게이지 정지
- 정지 위치의 구간으로 결과 판정

### 2.2 결과 판정

| 위치 | 결과 | 효과 |
|---|---|---|
| 퍼펙트존 | **홈런** | 즉시 회 클리어 (남은 공 스킵) + 화려한 컷씬 |
| 굿존 | **안타** | 회 내 안타 카운트 +1 |
| 미스존 | **스트라이크** | 게임 누적 스트라이크 +1 |

### 2.3 회 구조

- 1회당 최대 5구
- 회는 다음 중 가장 먼저 발생하는 이벤트에서 종료:
  - **홈런 1개** → 즉시 회 클리어 (남은 공 스킵, 다음 회로)
  - **안타 3개 누적** → 즉시 회 클리어 (남은 공 스킵, 다음 회로)
  - **누적 스트라이크 3개** → 즉시 게임오버
- 5구 안에 반드시 클리어 또는 게임오버가 발생 (수학적으로 보장: hits + strikes = 5 일 때 hits<3 AND strikes<3 동시 만족 불가)

### 2.4 게임오버 시 상태

- 누적 스트라이크 3개 도달 → 즉시 게임오버
- **누적 유지**: 점수, 도달 최고 회, 누적 홈런·안타 (광고 이어하기에 영향 없음)
- 이어하기 시 → 4.1 절 참조

### 2.5 진행

- 1회 → 2회 → 3회 ... → 50회 → 51회 (∞ 무한 모드)
- **1~50회**: 정해진 난이도 곡선 (게이지 속도 가속 / 퍼펙트존 축소)
- **51회+**: 50회 난이도에서 평형 유지 (천장 없음)
- 50회 클리어자 = 평생 마일스톤 (특수 컷씬)

---

## 3. 점수 시스템

| 이벤트 | 점수 | 비고 |
|---|---|---|
| 안타 | 100점 | 초기값 |
| 홈런 | 500점 | 초기값 |
| 회 클리어 보너스 | (회 번호) × 50 | 초기값 |

**TBD (시뮬레이션 튜닝)**:
- 정확한 가중치는 운영 후 데이터 보고 조정
- 50회 클리어 게임이 30회 클리어 게임보다 명확히 점수 높아야 함

---

## 4. 일일 플레이 정책

야구빠따 동일 패턴:

- **하루 5세션** (자정 KST 리셋)
  - 무료 2세션
  - 광고 시청 3세션
- **1세션 = 1트라이 + 광고 이어하기 최대 2회 = 최대 3트라이**

### 4.1 이어하기 동작

- 죽은 회의 첫 공부터 다시 시작
- 스트라이크: 0/3 으로 **리셋**
- 그 회의 안타 카운트: 0 으로 **리셋**
- 점수: 누적 유지
- 도달한 최고 회: 누적 유지

---

## 5. 응모권 시스템

매일 자정 KST 리셋. 그날 도달한 최고 회 기준:

| 마일스톤 | 응모권 |
|---|---|
| 5회 도달 | 1장 |
| 15회 도달 | 1장 |
| 30회 도달 | 1장 |

**최대 일일 3장**. 지급량은 초기값이며 운영 데이터 보고 튜닝.

---

## 6. 리더보드

### 6.1 정렬 규칙

```
ORDER BY round DESC, score DESC, created_at DESC
```

(야구빠따의 `level DESC, created_at DESC` 패턴에 `score` 컬럼 1개만 추가)

### 6.2 컬럼

| 컬럼 | 데이터 | 출처 |
|---|---|---|
| 순위 | 1, 2, 3... | 정렬 후 |
| 닉네임 | 폴리볼 유저 닉네임 | 부모 측 주입 |
| 응원팀 | 폴리볼 9개 응원팀 로고/약자 | 부모 측 주입 |
| 회 | 최고 도달 회 | 게임 기록 |
| 점수 | 그 게임 최종 점수 | 게임 기록 |
| 달성일 | YYYY-MM-DD | 서버 기록 |

표시 범위: TOP 100 + 본인 순위.

---

## 7. 디자인 톤 — 픽셀아트 (NES Classic Daytime)

### 7.1 컬러 팔레트 (CSS 변수)

폴리볼 컨벤션 (`var(--colors-*)`) 따라 네이밍:

```scss
--colors-game-grass:  #2C8930  // 잔디
--colors-game-soil:   #8B4513  // 흙 / 야구 다이아몬드
--colors-game-red:    #D62828  // 유니폼 / 강조
--colors-game-yellow: #FFC83D  // 효과 텍스트 / 점수
--colors-game-beige:  #F2E8C9  // 베이스 / 흰 텍스트 대체
--colors-game-sky:    #87CEEB  // 하늘 / 배경 상단
--colors-game-dark:   #1A1A1A  // 픽셀 윤곽선 / 그림자
```

SCSS 모듈 내에서 항상 `var(--colors-game-*)` 형태로 사용. 원시 hex 금지.

### 7.2 폰트

| 용도 | 폰트 후보 | 비고 |
|---|---|---|
| 한글 픽셀 | Galmuri11 | OFL 라이선스 (확인 필요) |
| 영문 픽셀 | Press Start 2P | OFL 라이선스 |
| 본문 (모달, 설명) | Pretendard | 폴리볼 기본 폰트 |

### 7.3 시각 원칙

- 모든 그래픽 `image-rendering: pixelated`
- 4px 그리드 단위 (캐릭터, UI 모두)
- 스캔라인 오버레이 (선택적, opacity 0.06)
- 효과 텍스트: 굵은 윤곽선 + 짧은 회전·스케일 애니메이션
- 홈런: 화면 흔들림 + 풀스크린 컷씬 0.5초
- 미스: 화면 빨강 깜빡임 0.2초

---

## 8. 자산 — Gemini 생성 6장

CSS로는 캐릭터 sprite 일관성·디테일이 약함 → 일러스트는 Gemini 생성, UI/HUD는 CSS.

**게임 화면 방향: 세로 (portrait, 9:16 모바일)** — 폴리볼이 모바일 앱이라 iframe 내부도 세로 풀스크린. 따라서 풀스크린 일러스트 5장은 모두 720×1280 (portrait), sprite sheet만 가로 strip 320×64.

### 8.1 자산 목록

| # | 자산 | 용도 | 해상도 | 빈도 |
|---|---|---|---|---|
| 1 | 타이틀 메인 일러스트 | 게임 시작 전 첫 화면 | 720×1280 portrait | 매 진입 |
| 2 | 인게임 배경 | 게임 진행 중 뒤배경 (풀스크린) | 720×1280 portrait | 매 회 |
| 3 | 타자 캐릭터 sprite sheet | 인게임 캐릭터 5포즈 | 320×64 strip (5×64) | 매 회 |
| 4 | 홈런 컷씬 일러스트 | 홈런 시 0.5초 풀스크린 | 720×1280 portrait | 매 홈런 |
| 5 | 게임오버 일러스트 | 게임 종료 화면 | 720×1280 portrait | 매 게임 종료 |
| 6 | 50회 클리어 축하 | 평생 마일스톤 | 720×1280 portrait | 평생 1회 |

### 8.2 개별 프롬프트

각 프롬프트는 Gemini에 그대로 복사·붙여넣기 가능. 스타일 가이드·팔레트·사이즈가 한 블록 안에 모두 포함.

---

**#1 타이틀 메인 일러스트**

```
8bit NES-style pixel art illustration. Portrait orientation, 720x1280 pixels
(mobile vertical, 9:16 aspect ratio).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep grass green #2C8930, soil brown #8B4513, bold red #D62828,
golden yellow #FFC83D, cream beige #F2E8C9, sky blue #87CEEB,
outline dark #1A1A1A. Max 3 shades per object. 4px grid units.
Famicom era (1985-1990) retro arcade aesthetic.

Subject: Korean baseball cleanup hitter standing confidently in batter's box.
Holding wooden bat (#8B4513) resting on shoulder. Wearing red jersey
(#D62828) with white pinstripes (#F2E8C9), dark cap (#1A1A1A) with
white star, white batting gloves. Heroic frontal pose, slight low-angle.

Background: green grass field (#2C8930) bottom 50%, crowd silhouette
band (#1A1A1A) middle 20%, sky (#87CEEB) top 30%. Strong sunlight
from upper right casting dark shadows.

Composition: Character centered in upper 70% of canvas. Bottom 30%
reserved as flat colored area (title text overlay added separately in CSS).

NO text, letters, numbers, or written symbols anywhere in the image.
NO gradients except the sky band. Transparent or solid background
for the bottom reserved area.
```

---

**#2 인게임 배경 (풀스크린)**

```
8bit NES-style pixel art background. Portrait orientation, 720x1280 pixels
(mobile vertical, 9:16 aspect ratio).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep grass green #2C8930, soil brown #8B4513, bold red #D62828,
golden yellow #FFC83D, cream beige #F2E8C9, sky blue #87CEEB,
outline dark #1A1A1A, navy accent #1A2B5C. Max 3 shades per object.
4px grid units. Famicom era retro arcade aesthetic.

Subject: Empty baseball stadium view from behind home plate.

Vertical composition (top to bottom):
- Top 35%: sky (#87CEEB) with subtle pixel clouds (#F2E8C9)
- Middle 25%: outfield wall (#1A2B5C) with crowd silhouette (#1A1A1A) on top, sponsor placard area (#F2E8C9 flat rectangle)
- Lower 30%: green outfield grass (#2C8930)
- Bottom 10%: dirt batter's box (#8B4513) with white foul line (#F2E8C9)

NO characters, ball, bat, or moving objects. This is a static backdrop
that game sprites and HUD overlay on top of.

NO text, letters, numbers, or written symbols anywhere in the image.
NO gradients. Hard pixel transitions between bands.
```

---

**#3 타자 캐릭터 sprite sheet**

```
8bit NES-style pixel art sprite sheet. Horizontal strip, 320x64 pixels total
(5 frames arranged left to right, each frame 64x64 pixels).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep red #D62828 (jersey), navy #1A2B5C (cap, pants), beige skin
#FFD7B3, cream #F2E8C9 (gloves, ball), brown #8B4513 (bat), dark
outline #1A1A1A. Max 3 shades per object. 4px grid units. Famicom era.

Frames (left to right, each 64x64):
1. IDLE - standing upright, bat over right shoulder, calm expression
2. SWING_WIND - knees bent slightly, bat pulled back behind head, body coiled
3. SWING_CONTACT - body rotated, bat horizontal mid-swing, motion lines
4. HOMERUN - heroic follow-through, bat raised high above head, open mouth shouting
5. STRIKEOUT - head down, bat dropped on ground, slumped shoulders, defeated

Transparent background. Each 64x64 frame is self-contained (no elements
cross frame boundaries). Character must occupy roughly the same vertical
position and bounding box across all 5 frames so they animate consistently.

NO text, letters, numbers, or written symbols anywhere in the sprite sheet.
```

---

**#4 홈런 컷씬 일러스트**

```
8bit NES-style pixel art illustration. Portrait orientation, 720x1280 pixels
(mobile vertical, 9:16 aspect ratio).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep grass green #2C8930, soil brown #8B4513, bold red #D62828,
golden yellow #FFC83D, cream beige #F2E8C9, sky blue #87CEEB,
outline dark #1A1A1A, navy #1A2B5C. Max 3 shades per object. 4px grid.
Famicom era retro arcade aesthetic.

Subject: Dramatic homerun moment. Baseball (#F2E8C9) flying out of stadium
into sky in upper third, with motion trail of golden yellow (#FFC83D) streaks
behind it. Bright radial burst (#FFC83D pixel rays) emanating from the ball.

Background:
- Top 40%: sky (#87CEEB) with the ball and motion trail
- Middle 30%: outfield wall (#1A2B5C) with crowd silhouettes raising arms (#1A1A1A)
- Bottom 30%: green grass (#2C8930) and back view of cleanup hitter (#D62828 jersey, #1A2B5C cap) with bat (#8B4513) raised in triumph

Composition: Strong diagonal flow from lower-left (hitter) to upper-right
(flying ball). Maximum impact energy.

Upper-left corner: leave a flat colored area suitable for "HOMERUN!" text
overlay (added separately in CSS).

NO text, letters, numbers, or written symbols anywhere in the image.
NO gradients except the sky.
```

---

**#5 게임오버 일러스트**

```
8bit NES-style pixel art illustration. Portrait orientation, 720x1280 pixels
(mobile vertical, 9:16 aspect ratio).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep grass green #2C8930, soil brown #8B4513, bold red #D62828,
golden yellow #FFC83D, cream beige #F2E8C9, deep orange #FF8C42,
outline dark #1A1A1A, navy #1A2B5C. Max 3 shades per object.
4px grid. Famicom era retro arcade aesthetic.

Subject: Cleanup hitter walking away from batter's box, dejected.
Side view, walking from right to left. Red jersey (#D62828),
navy cap (#1A2B5C) pulled low, head down, bat (#8B4513) dragging on
the ground behind. Beige skin (#FFD7B3).

Background:
- Top 40%: sunset sky in hard pixel bands (top to bottom: #FF8C42, #FFC83D, #D62828) — NO gradient, distinct color bands only
- Middle 30%: empty stadium scoreboard area (#1A1A1A flat rectangle), empty stadium seats silhouette (#1A1A1A)
- Bottom 30%: dirt path (#8B4513) and grass edges (#2C8930)

Mood: melancholic but hopeful — "come back tomorrow" feeling.

Center area of canvas: leave a flat dark rectangle (#1A1A1A) suitable for
"GAME OVER" text overlay (added separately in CSS).

NO text, letters, numbers, or written symbols anywhere in the image.
NO smooth gradients. Hard pixel band transitions only.
```

---

**#6 50회 클리어 축하 일러스트**

```
8bit NES-style pixel art illustration. Portrait orientation, 720x1280 pixels
(mobile vertical, 9:16 aspect ratio).

Strict color palette only (no anti-aliasing, hard pixel edges):
deep grass green #2C8930, soil brown #8B4513, bold red #D62828,
golden yellow #FFC83D, cream beige #F2E8C9, sky blue #87CEEB,
outline dark #1A1A1A, navy #1A2B5C. Max 3 shades per object.
4px grid. Famicom era retro arcade aesthetic.

Subject: Cleanup hitter standing on pitcher's mound in maximum hero pose.
Both arms raised high in victory. Red jersey (#D62828), navy cap
(#1A2B5C), beige skin (#FFD7B3). Right hand holding a large golden
trophy (#FFC83D with #8B4513 base). Big open-mouth shout of joy.

Background:
- Top 40%: sky (#87CEEB) with golden spotlight beams (#FFC83D pixel pattern at 70% density) shooting diagonally down
- Middle 30%: stadium crowd silhouettes (#1A1A1A) with raised arms
- Bottom 30%: pitcher's mound (#8B4513) on green field (#2C8930)

Foreground effect: confetti rain filling the canvas — small 4x4 pixel
squares scattered everywhere in #D62828, #FFC83D, and #F2E8C9 colors.

Upper banner area (top 15% horizontal strip): leave as flat #1A1A1A
rectangle suitable for "50회 클리어!" text overlay (added separately in CSS).

NO text, letters, numbers, or written symbols anywhere in the image.
NO smooth gradients.
```

---

## 9. PostMessage 프로토콜

prefix: `CLEANUP`

### 9.1 게임 → 부모

| 메시지 | payload | 시점 |
|---|---|---|
| `CLEANUP:PLAY_AD` | `{ reason: "continue" \| "extra_session" }` | 광고 시청 요청 |
| `CLEANUP:TICKET_REWARD` | `{ milestone: 5\|15\|30, count: 1 }` | 응모권 마일스톤 도달 시 |
| `CLEANUP:GAME_OVER` | `{ round, score, homeruns, hits, strikes, first_50_cleared_this_game?: boolean }` | 게임 종료 (리더보드 POST). `first_50_cleared_this_game`은 이 게임에서 평생 처음으로 50회 도달한 경우에만 `true` |
| `CLEANUP:GAME_READY` | `{}` | 게임 로드 완료 (USER_INFO 요청용) |

### 9.2 부모 → 게임

| 메시지 | payload | 시점 |
|---|---|---|
| `CLEANUP:AD_COMPLETED` | `{}` | 광고 시청 완료 → 이어하기 또는 세션 시작 |
| `CLEANUP:AD_FAILED` | `{ reason: string }` | 광고 실패 / 거부 |
| `CLEANUP:USER_INFO` | `{ nickname, team, free_left, ad_left, daily_milestones_done: number[], lifetime_50_done: boolean }` | 유저 정보 주입 |
| `CLEANUP:LEADERBOARD_DATA` | `{ entries: [...], my_rank: number }` | 리더보드 조회 응답 |

---

## 10. 백엔드 통합 (폴리볼 측 책임)

야구빠따와 동일 패턴:

1. **유저 식별** — 게임은 user_id 안 보냄. 부모 세션으로 매칭
2. **일일 카운터** — 서버 DB가 권위 (localStorage는 표시용)
3. **광고 SDK** — `PLAY_AD` 받으면 검증 후 노출
4. **응모권 적립** — `TICKET_REWARD` 받으면 유저 계정에 +1
5. **리더보드 API** — GET (정렬: `round DESC, score DESC, created_at DESC`) / POST (`GAME_OVER` payload 그대로)
6. **PIPA 동의** — 부모 측에서 처리

---

## 11. 화면 구조

| 화면 | 진입 조건 | 자산 |
|---|---|---|
| 타이틀 화면 | 게임 진입 | #1 타이틀 일러스트 |
| 인트로 컷씬 | 시작 버튼 클릭 | (선택) 카운트다운 + #2 배경 페이드인 |
| 게임 화면 | 인트로 종료 | #2 배경 + #3 캐릭터 + HUD CSS |
| 홈런 컷씬 | 퍼펙트 판정 | #4 홈런 일러스트 0.5초 |
| 광고 이어하기 모달 | 게임오버 직후 (이어하기 잔여 ≥ 1) | CSS 모달 |
| 결과 화면 | 이어하기 거부 / 소진 | #5 게임오버 일러스트 + 통계 |
| 리더보드 화면 | 결과 화면 → "리더보드" 버튼 | CSS 테이블 |
| 일일 한도 초과 화면 | 5세션 다 소진 | CSS |
| 50회 축하 화면 | 평생 첫 50회 도달 시 1회 | #6 50회 축하 일러스트 |

---

## 12. 인계 산출물

야구빠따 동일 형식:

1. `oneul-4taja-handoff.zip`
   - `README.md` (빠른 시작 + 체크리스트)
   - `INTEGRATION.md` (백엔드 통합 명세 — 0번 섹션 유저 식별)
   - 게임 코드 (Next.js)
   - 이미지 / 데이터
   - mock 데이터 (개발팀이 실 API로 교체)
2. `server-spec.html` (서버 기획서 한 페이지)
3. GitHub 저장소 (Vercel 프리뷰 동작 확인)

---

## 13. 기술 스택 (폴리볼 표준)

- Next.js 16.1.6 + React 19.2.3 (App Router)
- TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- SCSS Modules (BEM, `var(--colors-*)` 시맨틱 토큰)
- clsx (조건부 클래스)
- zustand (게임 상태)
- pnpm
- React Compiler 활성 (useMemo/useCallback 수동 X)
- 라우트 상수: `lib/routes.ts` `ROUTES` 객체
- 경로 별칭 `@/*` 없음. `'components/...'`, `'lib/...'` 직접

---

## 14. Open Questions (구현 단계에서 결정)

| 항목 | 비고 |
|---|---|
| 정확한 점수 가중치 (안타/홈런/회 보너스) | 시뮬레이션 튜닝, 일단 100/500/회×50 으로 시작 |
| 게이지 속도 곡선 (1→50회) | `data/rounds.ts`에 단계별 ms 값 테이블 |
| 퍼펙트존 크기 곡선 | 동상 |
| BGM / SFX (8bit 음원) | 라이선스 가능한 CC0 소스 후보 조사 |
| 폰트 라이선스 | Galmuri11, Press Start 2P 모두 OFL 가정. 코드에 명시 |
| 응원팀 mock 데이터 | 야구빠따와 동일 9팀 구조 재사용 |
| 광고 모달 카피·디자인 | "한 번 더?", "내일 다시!" 등 픽셀 폰트로 |

---

## 15. 야구빠따와 차별화 정리

| 항목 | 야구빠따 키우기 | 오늘의 4번타자 |
|---|---|---|
| 장르 | RPG / 육성 | 액션 / 타이밍 |
| 톤 | 검정 + 노랑 일러스트풍 | NES 픽셀아트 |
| 진행 | 단계 강화 | 회 단계 클리어 |
| prefix | `BBADA` | `CLEANUP` |
| 핵심 동사 | "키운다" | "친다" |
| 세션감 | 끈기·반복 | 한방·집중 |
| 콘텐츠 | 단계별 일러스트 50종 | 단일 캐릭터·배경 재사용 |

→ 시리즈로 묶기에 충분한 차별화 + 폴리볼 미니게임 표준 패턴(50단계/일일정책/응모권/리더보드) 공유.

---

## 부록 A — 야구빠따 참조

기존 게임 GitHub:
- `https://github.com/JHS-HECTO/yagu-bbada`
- 브랜치: `feat/level-50-expansion` (최종 인계 버전)

`INTEGRATION.md`, `README.md`를 템플릿 삼아 작성.
