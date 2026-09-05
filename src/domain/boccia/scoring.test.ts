import { describe, expect, it } from 'vitest';
import { computeRoundScores } from './scoring';

describe('computeRoundScores', () => {
  it('gives the closest participant 1 point', () => {
    expect(computeRoundScores(['a', 'b'], 'a', false, {})).toEqual({ a: 1, b: 0 });
  });

  it('gives the closest participant 2 points when they had both balls closest', () => {
    expect(computeRoundScores(['a', 'b'], 'a', true, {})).toEqual({ a: 2, b: 0 });
  });

  it('gives 1 bonus point per ball that hit the jack', () => {
    expect(computeRoundScores(['a', 'b', 'c'], 'a', false, { b: 1, c: 1 })).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('gives 2 bonus points when a team hits the jack with both balls', () => {
    expect(computeRoundScores(['a', 'b'], 'b', false, { a: 2 })).toEqual({ a: 2, b: 1 });
  });

  it('stacks the bonus for the closest participant if they also hit the ball', () => {
    expect(computeRoundScores(['a', 'b'], 'a', false, { a: 1 })).toEqual({ a: 2, b: 0 });
  });

  it('stacks the doubled-closest bonus with the ball-hit bonus', () => {
    expect(computeRoundScores(['a', 'b'], 'a', true, { a: 1 })).toEqual({ a: 3, b: 0 });
  });

  it('handles nobody hitting the ball', () => {
    expect(computeRoundScores(['a', 'b'], 'b', false, {})).toEqual({ a: 0, b: 1 });
  });
});
