import { describe, expect, it } from 'vitest';
import {
  distributeGroups,
  pickNoteTaker,
  shuffle,
  sizeWarning,
  sizesInRange,
  splitIntoGroups,
  suggestGroupCount,
  suggestGroupPlan,
} from './groupDistribution';

describe('suggestGroupCount', () => {
  it('suggests round(n/5) groups, minimum 1', () => {
    expect(suggestGroupCount(16)).toBe(3);
    expect(suggestGroupCount(5)).toBe(1);
    expect(suggestGroupCount(2)).toBe(1);
  });
});

describe('distributeGroups', () => {
  it('splits 16 players into 3 groups as 6, 5, 5', () => {
    expect(distributeGroups(16, 3)).toEqual([6, 5, 5]);
  });

  it('splits evenly when it divides exactly', () => {
    expect(distributeGroups(15, 3)).toEqual([5, 5, 5]);
  });
});

describe('suggestGroupPlan', () => {
  it('proposes 3 groups of 6/5/5 for 16 players', () => {
    const plan = suggestGroupPlan(16);
    expect(plan.groupCount).toBe(3);
    expect(plan.sizes.slice().sort((a, b) => b - a)).toEqual([6, 5, 5]);
    expect(plan.warning).toBeUndefined();
  });

  it('flags a warning when no nearby group count keeps sizes in range', () => {
    const plan = suggestGroupPlan(3);
    expect(sizesInRange(plan.sizes)).toBe(false);
    expect(plan.warning).toBeDefined();
  });
});

describe('sizeWarning', () => {
  it('warns outside 4-6, is silent inside it', () => {
    expect(sizeWarning(3)).toBeDefined();
    expect(sizeWarning(7)).toBeDefined();
    expect(sizeWarning(4)).toBeUndefined();
    expect(sizeWarning(6)).toBeUndefined();
  });
});

describe('shuffle', () => {
  it('returns a permutation of the same elements without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(result.slice().sort()).toEqual(input.slice().sort());
  });
});

describe('splitIntoGroups', () => {
  it('slices items according to sizes', () => {
    expect(splitIntoGroups(['a', 'b', 'c', 'd', 'e'], [2, 3])).toEqual([
      ['a', 'b'],
      ['c', 'd', 'e'],
    ]);
  });

  it('throws when sizes do not add up', () => {
    expect(() => splitIntoGroups(['a', 'b'], [2, 2])).toThrow();
  });
});

describe('pickNoteTaker', () => {
  it('only picks from eligible players when at least one is eligible', () => {
    const eligible = new Set(['b']);
    for (let i = 0; i < 10; i++) {
      expect(pickNoteTaker(['a', 'b', 'c'], eligible)).toBe('b');
    }
  });

  it('falls back to the whole table when nobody is eligible', () => {
    const picked = pickNoteTaker(['a', 'b'], new Set());
    expect(['a', 'b']).toContain(picked);
  });
});
