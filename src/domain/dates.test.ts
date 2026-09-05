import { describe, expect, it } from 'vitest';
import { formatNorwegianDate } from './dates';

describe('formatNorwegianDate', () => {
  it('reformats an ISO date to Norwegian dd.mm.yyyy', () => {
    expect(formatNorwegianDate('2026-07-15')).toBe('15.07.2026');
  });

  it('returns the input unchanged if it is not a well-formed ISO date', () => {
    expect(formatNorwegianDate('not-a-date')).toBe('not-a-date');
  });
});
