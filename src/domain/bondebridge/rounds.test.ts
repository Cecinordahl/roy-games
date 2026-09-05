import { describe, expect, it } from 'vitest';
import { buildRoundSequence, maxCards } from './rounds';

describe('maxCards', () => {
  it.each([
    [5, 10],
    [6, 8],
    [7, 7],
    [4, 10],
    [3, 10],
    [10, 5],
  ])('%i players -> %i cards', (players, expected) => {
    expect(maxCards(players)).toBe(expected);
  });
});

describe('buildRoundSequence', () => {
  it('DESC counts down from max to 1', () => {
    expect(buildRoundSequence(4, 'DESC')).toEqual([4, 3, 2, 1]);
  });

  it('ASC counts up from 1 to max', () => {
    expect(buildRoundSequence(4, 'ASC')).toEqual([1, 2, 3, 4]);
  });

  it('DESC_ASC goes max...1...max without repeating max, length 2*max-1', () => {
    const seq = buildRoundSequence(4, 'DESC_ASC');
    expect(seq).toEqual([4, 3, 2, 1, 2, 3, 4]);
    expect(seq).toHaveLength(7);
  });

  it('ASC_DESC goes 1...max...1 without repeating max, length 2*max-1', () => {
    const seq = buildRoundSequence(4, 'ASC_DESC');
    expect(seq).toEqual([1, 2, 3, 4, 3, 2, 1]);
    expect(seq).toHaveLength(7);
  });

  it('handles max=1 without duplicating the single round', () => {
    expect(buildRoundSequence(1, 'DESC_ASC')).toEqual([1]);
    expect(buildRoundSequence(1, 'ASC_DESC')).toEqual([1]);
  });
});
