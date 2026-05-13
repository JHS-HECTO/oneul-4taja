import { describe, it, expect } from 'vitest';
import { detectHit } from './hitDetection';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';
import type { RoundDifficulty } from 'lib/types';

const easy: RoundDifficulty = {
  round: 1,
  homerunSpeedMs: 2000,
  hitSpeedMs: 2600,
  perfectZoneRatio: 0.10, // homerun: 0.45..0.55
  hitZoneRatio: 0.30,     // hit: 0.35..0.65
};

const hard: RoundDifficulty = {
  round: 50,
  homerunSpeedMs: 600,
  hitSpeedMs: 900,
  perfectZoneRatio: 0.02, // homerun: 0.49..0.51
  hitZoneRatio: 0.12,     // hit: 0.44..0.56
};

describe('detectHit — homerun zone hits', () => {
  it('homerun centered (0.5) → homerun', () => {
    const r = detectHit(0.5, 0.0, easy); // hit anywhere
    expect(r.outcome).toBe('homerun');
    expect(r.scoreGained).toBe(SCORE_HOMERUN);
  });

  it('homerun just inside zone (0.54) → homerun', () => {
    expect(detectHit(0.54, 0.0, easy).outcome).toBe('homerun');
  });

  it('homerun outside zone but hit zone centered (0.5) → hit', () => {
    expect(detectHit(0.0, 0.5, easy).outcome).toBe('hit');
  });
});

describe('detectHit — hit zone catches when homerun misses', () => {
  it('homerun at extreme but hit inside (0.45) → hit', () => {
    const r = detectHit(0.05, 0.45, easy);
    expect(r.outcome).toBe('hit');
    expect(r.scoreGained).toBe(SCORE_HIT);
  });

  it('hit just inside zone (0.63) → hit', () => {
    expect(detectHit(0.0, 0.63, easy).outcome).toBe('hit');
  });
});

describe('detectHit — strike when both miss', () => {
  it('both far from center → strike', () => {
    const r = detectHit(0.05, 0.05, easy);
    expect(r.outcome).toBe('strike');
    expect(r.scoreGained).toBe(0);
  });

  it('both at extreme edges → strike', () => {
    expect(detectHit(0.0, 1.0, easy).outcome).toBe('strike');
  });
});

describe('detectHit — homerun priority', () => {
  it('both centered → homerun (not hit)', () => {
    const r = detectHit(0.5, 0.5, easy);
    expect(r.outcome).toBe('homerun');
  });
});

describe('detectHit (hard round)', () => {
  it('homerun zone is narrow (0.52 = out of homerun)', () => {
    const r = detectHit(0.52, 0.0, hard);
    expect(r.outcome).toBe('strike');
  });

  it('hit zone catches near center (0.55) → hit', () => {
    expect(detectHit(0.0, 0.55, hard).outcome).toBe('hit');
  });

  it('hit zone misses at 0.6 → strike', () => {
    expect(detectHit(0.0, 0.6, hard).outcome).toBe('strike');
  });
});
