import { describe, it, expect } from 'vitest';
import { computeGaugePosition } from './gauge';

describe('computeGaugePosition', () => {
  it('elapsed=0 → position 0, direction 1', () => {
    const f = computeGaugePosition(0, 1000);
    expect(f.position).toBe(0);
    expect(f.direction).toBe(1);
  });

  it('elapsed=speed/2 → position 0.5, going right', () => {
    const f = computeGaugePosition(500, 1000);
    expect(f.position).toBeCloseTo(0.5, 5);
    expect(f.direction).toBe(1);
  });

  it('elapsed approaching speed → position approaching 1, going right', () => {
    const f = computeGaugePosition(999, 1000);
    expect(f.position).toBeCloseTo(0.998, 2);
    expect(f.direction).toBe(1);
  });

  it('elapsed=1.5×speed → position 0.5, going left', () => {
    const f = computeGaugePosition(1500, 1000);
    expect(f.position).toBeCloseTo(0.5, 5);
    expect(f.direction).toBe(-1);
  });

  it('elapsed=2×speed (full cycle) → position 0, going right', () => {
    const f = computeGaugePosition(2000, 1000);
    expect(f.position).toBeCloseTo(0, 5);
  });

  it('position stays in [0, 1] for arbitrary elapsed times', () => {
    for (let t = 0; t < 10000; t += 73) {
      const f = computeGaugePosition(t, 1000);
      expect(f.position).toBeGreaterThanOrEqual(0);
      expect(f.position).toBeLessThanOrEqual(1);
    }
  });
});
