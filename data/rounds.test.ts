import { describe, it, expect } from 'vitest';
import { getDifficulty, ROUND_DIFFICULTY } from './rounds';

describe('rounds difficulty curve', () => {
  it('produces exactly 50 entries', () => {
    expect(ROUND_DIFFICULTY).toHaveLength(50);
  });

  it('round 1 is the easiest', () => {
    const r1 = getDifficulty(1);
    expect(r1.homerunSpeedMs).toBe(2000);
    expect(r1.hitSpeedMs).toBe(2600);
    expect(r1.perfectZoneRatio).toBe(0.10);
    expect(r1.hitZoneRatio).toBe(0.30);
  });

  it('round 50 is the hardest', () => {
    const r50 = getDifficulty(50);
    expect(r50.homerunSpeedMs).toBe(600);
    expect(r50.hitSpeedMs).toBe(900);
    expect(r50.perfectZoneRatio).toBeCloseTo(0.02, 5);
    expect(r50.hitZoneRatio).toBeCloseTo(0.12, 5);
  });

  it('round 51+ plateaus at round 50', () => {
    const r50 = getDifficulty(50);
    const r51 = getDifficulty(51);
    const r999 = getDifficulty(999);
    expect(r51).toEqual(r50);
    expect(r999).toEqual(r50);
  });

  it('difficulty increases monotonically 1→50', () => {
    for (let i = 1; i < 50; i++) {
      const prev = getDifficulty(i);
      const next = getDifficulty(i + 1);
      expect(next.homerunSpeedMs).toBeLessThan(prev.homerunSpeedMs);
      expect(next.hitSpeedMs).toBeLessThan(prev.hitSpeedMs);
      expect(next.perfectZoneRatio).toBeLessThan(prev.perfectZoneRatio);
      expect(next.hitZoneRatio).toBeLessThan(prev.hitZoneRatio);
    }
  });
});
