import { describe, it, expect } from 'vitest';
import { detectHit } from './hitDetection';
import { SCORE_HIT, SCORE_HOMERUN } from 'lib/constants';
import type { RoundDifficulty } from 'lib/types';

const easy: RoundDifficulty = {
  round: 1,
  gaugeSpeedMs: 2000,
  perfectZoneRatio: 0.20,  // perfect: 0.4..0.6
  goodZoneRatio: 0.15,     // good: 0.25..0.4, 0.6..0.75
};

const hard: RoundDifficulty = {
  round: 50,
  gaugeSpeedMs: 600,
  perfectZoneRatio: 0.04,  // perfect: 0.48..0.52
  goodZoneRatio: 0.06,     // good: 0.42..0.48, 0.52..0.58
};

describe('detectHit (easy round)', () => {
  it('center (0.5) → homerun', () => {
    const r = detectHit(0.5, easy);
    expect(r.outcome).toBe('homerun');
    expect(r.scoreGained).toBe(SCORE_HOMERUN);
  });

  it('inside perfect zone (0.59) → homerun', () => {
    expect(detectHit(0.59, easy).outcome).toBe('homerun');
  });

  it('inside good zone (0.7) → hit', () => {
    const r = detectHit(0.7, easy);
    expect(r.outcome).toBe('hit');
    expect(r.scoreGained).toBe(SCORE_HIT);
  });

  it('outside good zone (0.8) → strike', () => {
    const r = detectHit(0.8, easy);
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

  it('just outside perfect (0.53) → hit', () => {
    expect(detectHit(0.53, hard).outcome).toBe('hit');
  });

  it('outside good (0.6) → strike', () => {
    expect(detectHit(0.6, hard).outcome).toBe('strike');
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
