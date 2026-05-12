import type { RoundDifficulty } from 'lib/types';

// 회별 난이도 곡선. 1회 ~ 50회 정해진 값, 51+ 는 50회 동일.
// gaugeSpeedMs: 좌→우 1바퀴 시간 (ms). 낮을수록 빠름.
// perfectZoneRatio: 전체 게이지에서 퍼펙트존 비율 (0~1).
// goodZoneRatio: 퍼펙트존 양옆 굿존 비율 (한쪽).

const TABLE: RoundDifficulty[] = [];
for (let round = 1; round <= 50; round++) {
  // gaugeSpeed: 1회=2000ms → 50회=600ms 선형 감소
  const gaugeSpeedMs = 2000 - ((2000 - 600) * (round - 1)) / 49;
  // perfectZone: 1회=0.20 → 50회=0.04 선형 감소
  const perfectZoneRatio = 0.20 - ((0.20 - 0.04) * (round - 1)) / 49;
  // goodZone: 1회=0.15 → 50회=0.06 선형 감소
  const goodZoneRatio = 0.15 - ((0.15 - 0.06) * (round - 1)) / 49;
  TABLE.push({ round, gaugeSpeedMs, perfectZoneRatio, goodZoneRatio });
}

export const ROUND_DIFFICULTY: ReadonlyArray<RoundDifficulty> = TABLE;

export function getDifficulty(round: number): RoundDifficulty {
  // 51회+ 는 50회 동일 (평형)
  const idx = Math.min(Math.max(round, 1), 50) - 1;
  const entry = ROUND_DIFFICULTY[idx];
  if (!entry) {
    throw new Error(`Invalid round: ${round}`);
  }
  return entry;
}
