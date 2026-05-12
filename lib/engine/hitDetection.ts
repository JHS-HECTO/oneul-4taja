import type { HitResult, RoundDifficulty } from 'lib/types';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';

/**
 * 게이지 위치(0..1)와 회별 난이도 받아서 결과 판정.
 *
 * 게이지 레이아웃 (좌→우):
 *   [ MISS ][ GOOD ][ PERFECT ][ GOOD ][ MISS ]
 * 중심 = 0.5. perfect 구간은 0.5 양옆 perfectZoneRatio/2 씩.
 * good 구간은 그 양옆 goodZoneRatio 씩.
 * 나머지 양쪽 끝이 miss.
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
