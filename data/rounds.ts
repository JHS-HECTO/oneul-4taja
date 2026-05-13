import type { RoundDifficulty } from 'lib/types';

// 단일 게이지: [미스][안타][홈런][안타][미스]
// 1회: 빠른 편 (1400ms) + 홈런존 좁음 (5%) + 안타존 양옆 12%
// 50회: 매우 빠르고 (400ms) 홈런존 거의 점 (1%) + 안타존 4%

const TABLE: RoundDifficulty[] = [];
for (let round = 1; round <= 50; round++) {
  // 속도 ↑: 1회=900ms → 50회=250ms (이전 1400→400보다 35% 빠름)
  const gaugeSpeedMs = 900 - ((900 - 250) * (round - 1)) / 49;
  const perfectZoneRatio = 0.05 - ((0.05 - 0.01) * (round - 1)) / 49;
  const goodZoneRatio = 0.08 - ((0.08 - 0.02) * (round - 1)) / 49;
  // 11회부터 cubic ease-in-out — 가장자리에서 멈춤, 중앙에서 휙 지나감
  const easing = round >= 11 ? 'easeInOut' : 'linear';
  TABLE.push({ round, gaugeSpeedMs, perfectZoneRatio, goodZoneRatio, easing });
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
