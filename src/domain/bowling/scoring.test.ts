import { describe, expect, it } from 'vitest';
import { isValidBowlingScore } from './scoring';

describe('isValidBowlingScore', () => {
  it.each([0, 1, 150, 299, 300])('accepts %i', (score) => {
    expect(isValidBowlingScore(score)).toBe(true);
  });

  it.each([-1, 301, 1.5, NaN])('rejects %s', (score) => {
    expect(isValidBowlingScore(score)).toBe(false);
  });
});
