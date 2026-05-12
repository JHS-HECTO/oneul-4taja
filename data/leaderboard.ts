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
  '4번예약', '클린업히터', '주전기대', '잠재력터지면', '오늘의MVP',
];

const TEAM_CODES: TeamCode[] = [
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
    const baseRound = Math.floor(50 * (1 - i / 50));
    const round = Math.max(1, baseRound + Math.floor(rand() * 5) - 2);
    const score = round * 1000 + Math.floor(rand() * 800);
    const team = TEAM_CODES[Math.floor(rand() * TEAM_CODES.length)] ?? 'lg';
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
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}

export const MOCK_LEADERBOARD: ReadonlyArray<LeaderboardEntry> = buildMock();
