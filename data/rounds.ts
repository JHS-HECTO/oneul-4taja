import type { RoundDifficulty } from 'lib/types';

// 회별 난이도. 홈런·안타 존이 독립적으로 다른 속도로 움직임.
// homerunSpeedMs: 홈런 게이지 1바퀴 (1회=2000ms → 50회=600ms)
// hitSpeedMs: 안타 게이지 1바퀴 (1회=2600ms → 50회=900ms) — 홈런보다 1.4~1.5배 느림
// perfectZoneRatio: 홈런존 폭 (1회=0.10 → 50회=0.02)
// hitZoneRatio: 안타존 폭 (1회=0.30 → 50회=0.12) — 홈런보다 3~6배 넓음

const TABLE: RoundDifficulty[] = [];
for (let round = 1; round <= 50; round++) {
  const homerunSpeedMs = 2000 - ((2000 - 600) * (round - 1)) / 49;
  const hitSpeedMs = 2600 - ((2600 - 900) * (round - 1)) / 49;
  const perfectZoneRatio = 0.10 - ((0.10 - 0.02) * (round - 1)) / 49;
  const hitZoneRatio = 0.30 - ((0.30 - 0.12) * (round - 1)) / 49;
  TABLE.push({ round, homerunSpeedMs, hitSpeedMs, perfectZoneRatio, hitZoneRatio });
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
