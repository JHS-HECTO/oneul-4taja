import { describe, it, expect } from 'vitest';
import { MOCK_LEADERBOARD } from './leaderboard';

describe('mock leaderboard', () => {
  it('has 50 entries', () => {
    expect(MOCK_LEADERBOARD).toHaveLength(50);
  });

  it('is sorted by round DESC, score DESC', () => {
    for (let i = 0; i < MOCK_LEADERBOARD.length - 1; i++) {
      const a = MOCK_LEADERBOARD[i]!;
      const b = MOCK_LEADERBOARD[i + 1]!;
      if (a.round !== b.round) {
        expect(a.round).toBeGreaterThanOrEqual(b.round);
      } else {
        expect(a.score).toBeGreaterThanOrEqual(b.score);
      }
    }
  });

  it('assigns ranks 1..50', () => {
    expect(MOCK_LEADERBOARD[0]?.rank).toBe(1);
    expect(MOCK_LEADERBOARD[49]?.rank).toBe(50);
  });

  it('each entry has valid team code', () => {
    const valid = new Set(['lg', 'doosan', 'kt', 'ssg', 'samsung', 'lotte', 'hanwha', 'kia', 'nc']);
    MOCK_LEADERBOARD.forEach((e) => {
      expect(valid.has(e.team)).toBe(true);
    });
  });
});
