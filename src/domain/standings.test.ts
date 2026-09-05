import { describe, expect, it } from 'vitest';
import {
  computeStandings,
  findTieAtCutoff,
  highestSuccessfulBidTotal,
  penaltyPoints,
  resolveTie,
} from './standings';
import type { RoundLike } from './types';

const rounds = (rows: Array<[Record<string, number>, Record<string, number>, Record<string, number>]>): RoundLike[] =>
  rows.map(([bids, tricks, scores]) => ({ bids, tricks, scores }));

describe('computeStandings', () => {
  it('sums scores across rounds and sorts descending', () => {
    const r = rounds([
      [{ a: 1, b: 2 }, { a: 1, b: 2 }, { a: 11, b: 12 }],
      [{ a: 0, b: 1 }, { a: 1, b: 1 }, { a: -2, b: 11 }],
    ]);
    expect(computeStandings(r, ['a', 'b'])).toEqual([
      { playerId: 'b', total: 23 },
      { playerId: 'a', total: 9 },
    ]);
  });

  it('works mid-round with no completed rounds', () => {
    expect(computeStandings([], ['a', 'b'])).toEqual([
      { playerId: 'a', total: 0 },
      { playerId: 'b', total: 0 },
    ]);
  });
});

describe('penaltyPoints', () => {
  it('sums the absolute value of negative scores only', () => {
    const r = rounds([
      [{}, {}, { a: -4 }],
      [{}, {}, { a: 11 }],
      [{}, {}, { a: -2 }],
    ]);
    expect(penaltyPoints(r, 'a')).toBe(6);
  });
});

describe('highestSuccessfulBidTotal', () => {
  it('sums bids only for rounds where bid === tricks', () => {
    const r = rounds([
      [{ a: 3 }, { a: 3 }, { a: 13 }],
      [{ a: 2 }, { a: 1 }, { a: -2 }],
      [{ a: 0 }, { a: 0 }, { a: 5 }],
    ]);
    expect(highestSuccessfulBidTotal(r, 'a')).toBe(3);
  });

  it('returns 0 for a player who never hit a bid', () => {
    const r = rounds([[{ a: 2 }, { a: 1 }, { a: -2 }]]);
    expect(highestSuccessfulBidTotal(r, 'a')).toBe(0);
  });
});

describe('findTieAtCutoff', () => {
  it('finds the tied group straddling the cutoff', () => {
    const standings = [
      { playerId: 'a', total: 20 },
      { playerId: 'b', total: 10 },
      { playerId: 'c', total: 10 },
      { playerId: 'd', total: 5 },
    ];
    expect(findTieAtCutoff(standings, 2)).toEqual({ total: 10, playerIds: ['b', 'c'] });
  });

  it('returns undefined when there is no tie at the cutoff', () => {
    const standings = [
      { playerId: 'a', total: 20 },
      { playerId: 'b', total: 10 },
    ];
    expect(findTieAtCutoff(standings, 1)).toBeUndefined();
  });
});

describe('resolveTie', () => {
  it('BOTH_ADVANCE always resolves by including everyone', () => {
    const result = resolveTie({ total: 10, playerIds: ['a', 'b'] }, [], 'BOTH_ADVANCE');
    expect(result).toEqual({ resolved: true, order: ['a', 'b'] });
  });

  it('FEWEST_PENALTY breaks the tie toward the player with less penalty', () => {
    const r = rounds([
      [{}, {}, { a: -2, b: -4 }],
      [{}, {}, { a: 10, b: 10 }],
    ]);
    const result = resolveTie({ total: 10, playerIds: ['a', 'b'] }, r, 'FEWEST_PENALTY');
    expect(result).toEqual({ resolved: true, order: ['a', 'b'] });
  });

  it('HIGHEST_SUCCESSFUL_BID leaves two players who never hit a bid unresolved', () => {
    const r = rounds([
      [{ a: 2, b: 3 }, { a: 1, b: 4 }, { a: -2, b: -2 }],
      [{ a: 1, b: 1 }, { a: 0, b: 0 }, { a: -2, b: -2 }],
    ]);
    const result = resolveTie({ total: -4, playerIds: ['a', 'b'] }, r, 'HIGHEST_SUCCESSFUL_BID');
    expect(result).toEqual({ resolved: false, tied: ['a', 'b'] });
  });
});
