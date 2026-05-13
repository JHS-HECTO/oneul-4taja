import { describe, it, expect } from 'vitest';
import { detectHit } from './hitDetection';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';
import type { RoundDifficulty } from 'lib/types';

const easy: RoundDifficulty = {
  round: 1,
  gaugeSpeedMs: 1400,
  perfectZoneRatio: 0.05,  // homerun: 0.475..0.525
  goodZoneRatio: 0.12,     // hit: 0.355..0.475, 0.525..0.645
};

const hard: RoundDifficulty = {
  round: 50,
  gaugeSpeedMs: 400,
  perfectZoneRatio: 0.01,  // homerun: 0.495..0.505
  goodZoneRatio: 0.04,     // hit: 0.455..0.495, 0.505..0.545
};

describe('detectHit (easy round)', () => {
  it('center (0.5) → homerun', () => {
    const r = detectHit(0.5, easy);
    expect(r.outcome).toBe('homerun');
    expect(r.scoreGained).toBe(SCORE_HOMERUN);
  });

  it('inside perfect zone (0.52) → homerun', () => {
    expect(detectHit(0.52, easy).outcome).toBe('homerun');
  });

  it('inside good zone (0.6) → hit', () => {
    const r = detectHit(0.6, easy);
    expect(r.outcome).toBe('hit');
    expect(r.scoreGained).toBe(SCORE_HIT);
  });

  it('outside good zone (0.7) → strike', () => {
    const r = detectHit(0.7, easy);
    expect(r.outcome).toBe('strike');
    expect(r.scoreGained).toBe(0);
  });

  it('extreme left (0.0) → strike', () => {
    expect(detectHit(0.0, easy).outcome).toBe('strike');
  });

  it('extreme right (1.0) → strike', () => {
    expect(detectHit(1.0, easy).outcome).toBe('strike');
  });
});

describe('detectHit (hard round)', () => {
  it('center (0.5) → homerun', () => {
    expect(detectHit(0.5, hard).outcome).toBe('homerun');
  });

  it('just outside perfect (0.51) → hit', () => {
    expect(detectHit(0.51, hard).outcome).toBe('hit');
  });

  it('outside good (0.55) → strike', () => {
    expect(detectHit(0.55, hard).outcome).toBe('strike');
  });
});

describe('symmetry', () => {
  it('result is symmetric around 0.5', () => {
    for (let d = 0; d < 0.5; d += 0.05) {
      const left = detectHit(0.5 - d, easy);
      const right = detectHit(0.5 + d, easy);
      expect(left.outcome).toBe(right.outcome);
    }
  });
});
