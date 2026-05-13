import type { HitResult, RoundDifficulty } from 'lib/types';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

const CURSOR = 0.5;

/**
 * 홈런/안타 존이 독립적으로 움직이는 dual-gauge 판정.
 *
 * 각 존의 중심 위치 (0..1) 와 회차 난이도를 받아서 결과 판정.
 * - 커서는 항상 정중앙 (0.5)
 * - homerunPos가 커서로부터 ±perfectZoneRatio/2 안 → 홈런
 * - 그 외에 hitPos가 커서로부터 ±hitZoneRatio/2 안 → 안타
 * - 둘 다 벗어남 → 스트라이크
 *
 * 홈런 판정이 안타 판정보다 우선.
 */
export function detectHit(
  homerunPos: number,
  hitPos: number,
  diff: RoundDifficulty
): HitResult {
  const homerunHalf = diff.perfectZoneRatio / 2;
  const hitHalf = diff.hitZoneRatio / 2;

  if (Math.abs(homerunPos - CURSOR) <= homerunHalf) {
    return { outcome: 'homerun', position: homerunPos, scoreGained: SCORE_HOMERUN };
  }
  if (Math.abs(hitPos - CURSOR) <= hitHalf) {
    return { outcome: 'hit', position: hitPos, scoreGained: SCORE_HIT };
  }
  return { outcome: 'strike', position: homerunPos, scoreGained: 0 };
}
