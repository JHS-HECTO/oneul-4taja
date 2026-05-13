import type { RoundDifficulty } from 'lib/types';

// 단일 게이지: [미스][안타][홈런][안타][미스]
// 1회: 빠른 편 (1400ms) + 홈런존 좁음 (5%) + 안타존 양옆 12%
// 50회: 매우 빠르고 (400ms) 홈런존 거의 점 (1%) + 안타존 4%

const TABLE: RoundDifficulty[] = [];
for (let round = 1; round <= 50; round++) {
  const gaugeSpeedMs = 1400 - ((1400 - 400) * (round - 1)) / 49;
  const perfectZoneRatio = 0.05 - ((0.05 - 0.01) * (round - 1)) / 49;
  const goodZoneRatio = 0.12 - ((0.12 - 0.04) * (round - 1)) / 49;
  TABLE.push({ round, gaugeSpeedMs, perfectZoneRatio, goodZoneRatio });
}

export const ROUND_DIFFICULTY: ReadonlyArray<RoundDifficulty> = TABLE;

export function getDifficulty(round: number): RoundDifficulty {
  const idx = Math.min(Math.max(round, 1), 50) - 1;
  const entry = ROUND_DIFFICULTY[idx];
  if (!entry) {
    throw new Error(`Invalid round: ${round}`);
  }
  return entry;
}
