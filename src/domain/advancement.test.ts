import { describe, expect, it } from 'vitest';
import {
  planRemainingTables,
  proposeAdvancement,
  suggestAdvanceCount,
  validateAdvanceCount,
} from './advancement';

describe('proposeAdvancement', () => {
  it('splits winners and remaining players from each group order', () => {
    const groupOrders = [
      ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['c1', 'c2', 'c3', 'c4', 'c5'],
    ];
    const { winnersPlayerIds, remainingPlayerIds } = proposeAdvancement(groupOrders, 2);
    expect(winnersPlayerIds).toEqual(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);
    expect(remainingPlayerIds).toHaveLength(10);
  });
});

describe('suggestAdvanceCount', () => {
  it('suggests 2 per group for 3 groups (16 players, 6/5/5) to land a 6-player winners table', () => {
    expect(suggestAdvanceCount([6, 5, 5])).toBe(2);
  });
});

describe('validateAdvanceCount', () => {
  it('rejects an advance count larger than the smallest group', () => {
    const result = validateAdvanceCount([6, 5, 5], 6);
    expect(result.valid).toBe(false);
    expect(result.suggestedAdvanceCount).toBe(5);
  });

  it('accepts a workable advance count', () => {
    expect(validateAdvanceCount([6, 5, 5], 2)).toEqual({ valid: true });
  });
});

describe('planRemainingTables', () => {
  it('splits 10 remaining players into 5/5, not 6/5', () => {
    const plan = planRemainingTables(10);
    expect(plan.groupCount).toBe(2);
    expect(plan.sizes.slice().sort((a, b) => b - a)).toEqual([5, 5]);
  });

  it('the worked example: 16 players, 3 groups, 2 advance each -> 6 winners + 5/5 remaining', () => {
    const groupOrders = [
      ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
      ['b1', 'b2', 'b3', 'b4', 'b5'],
      ['c1', 'c2', 'c3', 'c4', 'c5'],
    ];
    const { winnersPlayerIds, remainingPlayerIds } = proposeAdvancement(groupOrders, 2);
    expect(winnersPlayerIds).toHaveLength(6);
    expect(remainingPlayerIds).toHaveLength(10);
    const plan = planRemainingTables(remainingPlayerIds.length);
    expect(plan.sizes.slice().sort((a, b) => b - a)).toEqual([5, 5]);
  });

  it('returns no tables when nobody remains', () => {
    expect(planRemainingTables(0)).toEqual({ groupCount: 0, sizes: [] });
  });
});
