import { describe, expect, it } from 'vitest';
import { roundScore } from './scoring';

describe('roundScore', () => {
  it.each([
    [0, 1, -2],
    [0, 0, 5],
    [1, 0, -2],
    [1, 1, 11],
    [1, 3, -4],
    [4, 4, 14],
    [2, 2, 12],
  ])('bid=%i tricks=%i -> %i', (bid, tricks, expected) => {
    expect(roundScore(bid, tricks)).toBe(expected);
  });
});
