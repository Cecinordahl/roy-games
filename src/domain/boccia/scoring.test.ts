import { describe, expect, it } from 'vitest';
import { computeRoundScores } from './scoring';

describe('computeRoundScores', () => {
  it('gives the closest participant 1 point', () => {
    expect(computeRoundScores(['a', 'b'], 'a', [])).toEqual({ a: 1, b: 0 });
  });

  it('gives every ball-hitter 1 bonus point', () => {
    expect(computeRoundScores(['a', 'b', 'c'], 'a', ['b', 'c'])).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('stacks the bonus for the closest participant if they also hit the ball', () => {
    expect(computeRoundScores(['a', 'b'], 'a', ['a'])).toEqual({ a: 2, b: 0 });
  });

  it('handles nobody hitting the ball', () => {
    expect(computeRoundScores(['a', 'b'], 'b', [])).toEqual({ a: 0, b: 1 });
  });
});
