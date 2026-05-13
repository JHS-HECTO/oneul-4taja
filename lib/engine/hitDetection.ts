import type { HitResult, RoundDifficulty } from 'lib/types';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

/**
 * 단일 게이지 위치 → 결과 판정.
 * 레이아웃: [미스][안타][홈런][안타][미스] 가운데 기준 양쪽 대칭.
 *   - 중심에서 perfectHalf 안 → 홈런
 *   - perfectHalf 밖, goodHalf 안 → 안타
 *   - 그 외 → 스트라이크
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
