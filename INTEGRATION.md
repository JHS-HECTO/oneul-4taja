# 🛠 개발팀 통합 가이드 — 오늘의 4번타자 → 폴리볼

> 폴리볼 측에서 작업해야 할 부분들을 한곳에 정리.
> 각 항목별로 코드 위치 + 통신 프로토콜 + 처리해줘야 할 동작 명시.
>
> postMessage prefix: **`CLEANUP`** (야구빠따는 `BBADA` 였습니다 — 두 게임을 별도 라우터로 처리하기 위해 prefix를 다르게 사용)

---

## 🚨 0. 통합의 대전제 — 유저 식별 (★★★ 필수)

게임 자체는 **유저를 식별하지 않습니다**. 모든 유저별 정책(일일 횟수, 응모권 적립, 리더보드 기록 등)은 **폴리볼 측에서 식별 + 검증**해야 합니다.

### 게임이 모르는 것 (폴리볼이 알아야 할 것)

| 항목 | 게임 측 | 폴리볼 측에서 처리 |
|---|---|---|
| 누가 플레이 중인지 | ❌ 모름 | ✅ 로그인 세션으로 식별 |
| 오늘 몇 판 했는지 | ⚠️ 표시용 (zustand 메모리, 새로고침 시 리셋) | ✅ **서버 DB로 유저별 카운터 관리 필수** |
| 광고 시청 가능 여부 | ❌ 모름 | ✅ 유저별로 광고 횟수 검증 후 응답 |
| 응모권 적립 대상 | ❌ 모름 | ✅ postMessage 받을 때 현재 로그인 유저에 적립 |
| 리더보드 본인 식별 | ❌ 모름 | ✅ 본인 row에 `is_me: true` 플래그 부착 |

### 즉, 폴리볼 측에서 반드시 해야 할 것

**1) 게임 진입 시 USER_INFO 주입 (postMessage)**

게임이 로드되면 즉시 `CLEANUP:GAME_READY` 를 부모에 emit합니다. 부모는 이를 받아 현재 로그인 유저의 정보를 `CLEANUP:USER_INFO` 로 응답해야 합니다 (자세한 메시지 스키마는 1번 섹션 참조).

**2) postMessage 이벤트 처리 시 유저 컨텍스트 자동 부착**

게임이 보내는 메시지(`PLAY_AD`, `TICKET_REWARD`, `GAME_OVER`)에는 user 정보 없음. 폴리볼이 이걸 받을 때 **현재 iframe을 띄운 로그인 유저**에 자동 매칭하여 처리.

**3) 리더보드 API 데이터 응답 (postMessage)**

게임이 리더보드 화면 진입 시 `CLEANUP:LEADERBOARD_REQUEST` emit. 폴리볼은 `CLEANUP:LEADERBOARD_DATA` 로 응답.

**4) 게임오버 자동 등록**

게임이 `CLEANUP:GAME_OVER`를 emit하면 (round/score 포함), 폴리볼이 세션 쿠키로 유저 식별 → 리더보드 DB에 자동 저장.

### ⚖️ 개인정보 수집·이용 동의 (필수 — PIPA 준수)

- 수집 항목: 닉네임, 응원팀, 게임 플레이 기록(도달 회, 점수, 응모권 적립 내역)
- 이용 목적: 게임 서비스 제공, 리더보드 노출, 응모권 지급
- 보관 기간: 회원 탈퇴 시까지 / 리더보드는 서비스 종료 시까지
- 만 14세 미만 유저 처리 (폴리볼 가입 단계에서 처리되어 있을 듯)

---

## 📡 1. PostMessage 프로토콜

게임은 iframe으로 임베드되며 `window.parent.postMessage` 로 부모와 양방향 통신.

### 1-1. 게임 진입 + 유저 정보 주입

**게임 → 부모** (로드 완료 통지)
```js
{ type: 'CLEANUP:GAME_READY' }
```

**부모 → 게임** (유저 정보 응답)
```js
{
  type: 'CLEANUP:USER_INFO',
  nickname: '4번타자김선수',
  team: 'lg',                       // 9팀 enum: lg | doosan | kt | ssg | samsung | lotte | hanwha | kia | nc
  free_left: 2,                     // 무료 세션 잔여 (0~2)
  ad_left: 3,                       // 광고 세션 잔여 (0~3)
  daily_milestones_done: [10, 20],  // 오늘 이미 받은 마일스톤 회 목록 (선택)
  lifetime_50_done: false,          // 평생 50회 첫 도달 여부 (선택)
}
```

#### 부모 측 처리 예시
```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'CLEANUP:GAME_READY') {
    const user = currentLoggedInUser; // 폴리볼 세션에서 추출
    const counters = serverFetchDailyPlays(user.id); // 서버 DB에서 조회
    gameIframe.contentWindow.postMessage({
      type: 'CLEANUP:USER_INFO',
      nickname: user.nickname,
      team: user.team,
      free_left: counters.free_left,
      ad_left: counters.ad_left,
      daily_milestones_done: counters.daily_milestones_done,
      lifetime_50_done: user.lifetime_50_done,
    }, '*');
  }
});
```

### 1-2. 광고 재생 (이어하기 / 추가 세션)

**게임 → 부모** (광고 요청)
```js
{ type: 'CLEANUP:PLAY_AD', reason: 'continue' }
// reason: 'continue' (이어하기) | 'extra_session' (광고 세션 추가)
```

**부모 → 게임** (응답)
```js
// 광고 재생 완료
{ type: 'CLEANUP:AD_COMPLETED' }

// 광고 재생 실패 (중도 이탈, 네트워크 오류 등)
{ type: 'CLEANUP:AD_FAILED', reason: 'user_skipped' }
```

#### 부모 측 처리 예시
```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'CLEANUP:PLAY_AD') {
    // ★ 서버에서 ad_left > 0 검증 후 광고 노출
    yourAdSDK.show({
      onComplete: () => {
        serverIncrementAdUsed(currentUser.id);
        gameIframe.contentWindow.postMessage(
          { type: 'CLEANUP:AD_COMPLETED' }, '*'
        );
      },
      onError: (reason) => {
        gameIframe.contentWindow.postMessage(
          { type: 'CLEANUP:AD_FAILED', reason }, '*'
        );
      }
    });
  }
});
```

#### 발생 시점 (게임 측)
- **게임오버 화면 "광고보고 이어하기" 버튼 클릭 시** (reason: `continue`)
- (향후) **타이틀 "광고 보고 시작" 버튼 클릭 시** (reason: `extra_session`)

### 1-3. 응모권 보상 (10/20/30/40/50 회 도달 시)

**게임 → 부모** (보상 발생 알림)
```js
{ type: 'CLEANUP:TICKET_REWARD', round: 10, count: 1 }
{ type: 'CLEANUP:TICKET_REWARD', round: 20, count: 1 }
{ type: 'CLEANUP:TICKET_REWARD', round: 30, count: 1 }
{ type: 'CLEANUP:TICKET_REWARD', round: 40, count: 1 }
{ type: 'CLEANUP:TICKET_REWARD', round: 50, count: 1 }
```

#### 발생 시점
- 각 마일스톤 회(10/20/30/40/50)에 **진입하는 순간** (즉, 이전 회 클리어 직후 nextRound가 마일스톤에 도달했을 때)
- 게임에서는 보상 팝업 표시 + 메시지 emit 둘 다 동시 진행
- **실제 응모권 적립은 폴리볼/백엔드에서 처리** — 메시지 받아 유저 계정에 +1

#### 지급량 정책 (현재)
- 모든 마일스톤 `count: 1` 로 통일 (단순화)
- 야구빠따(`{1, 2, 5, 15, 100}`)와 다름 — 운영 데이터 보고 추후 튜닝 가능
- 게임 코드 위치: `lib/constants.ts` → `TICKETS_PER_MILESTONE`

#### 부모 측 처리 예시
```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'CLEANUP:TICKET_REWARD') {
    const { round, count } = e.data;
    yourBackend.addTickets(currentUser.id, count, {
      reason: `cleanup_milestone_round${round}`
    });
  }
});
```

#### 게임 코드 위치
- `lib/postMessage.ts` → `emit()`, `OutgoingMessage` 타입
- `lib/store/gameStore.ts` → `proceedAfterJudging` 내부에서 emit
- `lib/constants.ts` → `DAILY_TICKET_MILESTONES`, `TICKETS_PER_MILESTONE`

### 1-4. 게임 종료 결과 (자동 리더보드 등록)

**게임 → 부모** (게임 종료 시점)
```js
{
  type: 'CLEANUP:GAME_OVER',
  round: 23,                            // 도달한 최고 회
  score: 12340,                         // 최종 점수
  homeruns: 5,                          // 누적 홈런
  hits: 32,                             // 누적 안타
  strikes: 3,                           // 누적 아웃 (=STRIKES_TO_GAME_OVER)
  first_50_cleared_this_game: false,    // (선택) 평생 첫 50회 클리어 여부
}
```

#### 발생 시점
- 이어하기 거부 (`giveUp`) → `result` phase
- 이어하기 잔여 0 + 게임오버 cutscene 종료 → `result` phase

#### 부모 측 처리 예시
```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'CLEANUP:GAME_OVER') {
    const { round, score, homeruns, hits } = e.data;
    yourBackend.submitLeaderboard(currentUser.id, {
      round, score, homeruns, hits,
    });

    // 평생 50회 첫 클리어 영구 상태 업데이트
    if (e.data.first_50_cleared_this_game) {
      yourBackend.setLifetime50Done(currentUser.id);
    }
  }
});
```

---

## 🏆 2. 리더보드

### 2-1. 데이터 흐름

게임이 리더보드 화면 진입 시 `CLEANUP:LEADERBOARD_REQUEST` 를 emit. 부모는 응답:

**게임 → 부모**
```js
{ type: 'CLEANUP:LEADERBOARD_REQUEST' }
```

**부모 → 게임**
```js
{
  type: 'CLEANUP:LEADERBOARD_DATA',
  entries: [
    {
      rank: 1,
      nickname: '4번타자김선수',
      team: 'lg',
      round: 47,
      score: 23450,
      created_at: '2026-05-12',  // ISO YYYY-MM-DD
      is_me: false,              // 본인 row 식별
    },
    // ... 50개까지
  ],
  my_rank: 23, // 본인이 100위 밖이면 별도 표시용 (선택)
}
```

### 2-2. 정렬 정책

```sql
ORDER BY round DESC, score DESC, created_at DESC
LIMIT 100
```

- 도달 회 높은 순 (1차)
- 동률 시 점수 높은 순 (2차) — 야구빠따와 다른 점, 점수 변별력 추가
- 동률 시 최근에 달성한 기록 먼저 (3차)

### 2-3. 폴백 동작

게임은 USER_INFO/LEADERBOARD_DATA 메시지를 받지 못한 경우 (5초 타임아웃) **`data/leaderboard.ts` 의 mock 데이터**를 사용합니다. 실제 운영에서는 mock이 노출되지 않아야 합니다.

### 2-4. 자동 기록 등록

게임은 명시적 "기록하기" 버튼이 **없습니다**. `CLEANUP:GAME_OVER` 받으면 폴리볼이 자동 등록.

### 2-5. 응원팀 enum

```ts
type TeamCode = 'lg' | 'doosan' | 'kt' | 'ssg' | 'samsung'
              | 'lotte' | 'hanwha' | 'kia' | 'nc';
```

데이터: `data/teams.ts` 에 9팀 색상/풀네임/약어 정의. KBO 10팀 중 키움(`kiwoom`)만 빠짐 — 폴리볼 정책과 맞춰주세요 (필요 시 추가).

---

## 🎫 3. 일일 플레이 횟수 정책

```
하루 최대 5세션 = 무료 2회 + 광고 3회
1세션 = 1트라이 + 광고 이어하기 2회 = 최대 3트라이
```

### 현재 게임 구현
- 게임 측은 zustand 메모리로 **표시용** 카운터만 관리 (`lib/store/gameStore.ts` → `freeSessionsLeft`, `adSessionsLeft`)
- localStorage 영속화 X (브라우저 새로고침 시 리셋) — **권위는 서버**

### ⚠️ 폴리볼 측에서 반드시 해야 할 것 (서버 카운터)

- [ ] 유저별 `daily_plays` 테이블/컬럼 (`user_id`, `date`, `free_used`, `ad_used`)
- [ ] `CLEANUP:GAME_READY` 받았을 때 → 서버에서 잔여 카운트 조회 → `CLEANUP:USER_INFO` 응답에 포함
- [ ] `CLEANUP:PLAY_AD` 받았을 때 → 서버에서 `ad_used < 3` 검증 → 통과 시 광고 노출
- [ ] 광고 완료 콜백 시점에 서버 카운터 +1 (`ad_used++`)
- [ ] 자정 KST 기준 자동 리셋 (cron 또는 lazy 갱신)

---

## 🔌 4. 폴리볼 통합 시 추가 작업

### 4-1. 실험실 메뉴 진입점 (UI)
- iframe src: 폴리볼 측 호스팅 URL
- 권장 사이즈: 모바일 풀스크린 (9:16, 360×640 ~ 412×892 안전 영역)
- 닫기 버튼: 폴리볼 측에서 제공 (게임 안에는 없음)
- 게임 자체는 100svh 단위로 viewport 채움 (mobile 주소창/네비바 자동 대응)

### 4-2. 미디어 자산
- `public/images/` 6장 이미지 + 18장 sprite frames + 1장 ticket.png 포함 모두 패키지에
- 추가 자산 필요 X — 그대로 호스팅하면 됨

---

## ✅ 5. 체크리스트

게임 측에서 **이미 구현 완료**:
- [x] 50회 단계 클리어 + 무한 모드 (51회+ 평형)
- [x] 회당 5구 안에 3안타 OR 1홈런 = 클리어, 누적 3아웃 = 게임오버
- [x] 일일 5세션 카운터 (zustand 메모리)
- [x] 응모권 보상 popup (10/20/30/40/50, 야구빠따 디자인 매칭)
- [x] 광고 이어하기 모달
- [x] 리더보드 화면 (mock 데이터 + 9팀 로고)
- [x] PostMessage 6종 양방향 통신 (`lib/postMessage.ts`)
- [x] 부모 통신 브릿지 hook (`lib/hooks/useParentBridge.ts`)
- [x] 임베드 안 된 환경(dev) 자동 폴백

폴리볼/개발팀에서 **작업 필요**:

**🚨 0번 섹션 — 유저 식별 (전제):**
- [ ] 게임 진입 시 `CLEANUP:GAME_READY` 수신 → 현재 로그인 유저 정보로 `CLEANUP:USER_INFO` 응답
- [ ] **서버 DB**에 유저별 `daily_plays` 테이블 (`free_used`, `ad_used`, `date`)
- [ ] **개인정보 수집·이용 동의** 받기 (PIPA 준수)

**1번 섹션 — postMessage:**
- [ ] `CLEANUP:PLAY_AD` 수신 → 서버 광고 잔여 검증 → 광고 노출 → `AD_COMPLETED` / `AD_FAILED` 회신
- [ ] `CLEANUP:TICKET_REWARD` 수신 → 유저 계정에 응모권 적립
- [ ] `CLEANUP:GAME_OVER` 수신 → 리더보드 DB 자동 저장 + (있으면) 평생 50회 첫 도달 처리

**2번 섹션 — 리더보드:**
- [ ] `CLEANUP:LEADERBOARD_REQUEST` 수신 → 서버 조회 → `CLEANUP:LEADERBOARD_DATA` 응답
- [ ] 정렬 정책: `round DESC, score DESC, created_at DESC LIMIT 100`
- [ ] (선택) 본인 row에 `is_me: true` 부착

---

## 📂 코드 내 주요 위치 한눈에

| 항목 | 파일 | 비고 |
|---|---|---|
| PostMessage emit/listen | `lib/postMessage.ts` | OutgoingMessage / IncomingMessage 타입 정의 |
| 부모 통신 브릿지 hook | `lib/hooks/useParentBridge.ts` | GAME_READY emit + USER_INFO/AD_COMPLETED 수신 |
| 응모권 마일스톤 / emit | `lib/store/gameStore.ts` → `proceedAfterJudging` | nextRound 기반 마일스톤 체크 + emit |
| 게임오버 emit | `lib/store/gameStore.ts` → `giveUp`, `endCutscene` | result phase 진입 시 emit |
| 광고 이어하기 emit | `components/Result/ContinueModal.tsx` → `handleContinue` | 임베드면 PLAY_AD emit, 아니면 즉시 startContinue |
| 리더보드 데이터 hook | `lib/hooks/useLeaderboard.ts` | 임베드면 LEADERBOARD_REQUEST + 응답 대기, 아니면 mock |
| 일일 세션 카운터 | `lib/store/gameStore.ts` → `freeSessionsLeft`, `adSessionsLeft` | zustand 메모리만, 서버 권위 |
| 마일스톤 상수 | `lib/constants.ts` → `DAILY_TICKET_MILESTONES`, `TICKETS_PER_MILESTONE` | `[10, 20, 30, 40, 50]` × 1장 |
| 응원팀 enum | `data/teams.ts` → `TEAMS`, `TeamCode` | 9팀 |
| 임시 mock 리더보드 | `data/leaderboard.ts` → `MOCK_LEADERBOARD` | 실 API 연결 후 사용 안 됨 (폴백용으로 코드는 유지) |
| 회별 난이도 | `data/rounds.ts` → `ROUND_DIFFICULTY` | 1~50회 곡선 + 11회+ ease-in-out |

---

## 🧪 6. 부모 mock 페이지 (개발팀 통합 검증용)

`public/parent-mock.html` 에 부모 측 동작을 흉내내는 mock 페이지가 포함되어 있습니다. iframe으로 게임을 띄우고 모든 메시지를 콘솔에 로그 + 적절한 응답을 자동 회신.

사용법:
1. `pnpm dev` 실행
2. http://localhost:3000/parent-mock.html 열기
3. iframe 안에 게임이 뜨고, devtools console에 메시지 흐름 확인 가능

실제 통합 시 이 파일을 참고하여 폴리볼 코드에 동일한 listener 구현하면 됩니다.

---

## 📞 문의

게임 측 코드/스펙에 대한 질문은 인계자(HECTO/JHS-HECTO)에게 문의.
