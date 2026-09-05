import type { RoundSequenceMode } from '../types';

/** Standard 52-card deck, no jokers; 10 is the ceiling regardless of table size. */
export function maxCards(playerCount: number): number {
  return Math.min(10, Math.floor(52 / playerCount));
}

/**
 * Resolves the full round-by-round card sequence for a table.
 * DESC_ASC / ASC_DESC turn around at `max` without repeating it, giving 2*max-1 rounds.
 */
export function buildRoundSequence(max: number, mode: RoundSequenceMode): number[] {
  const desc = Array.from({ length: max }, (_, i) => max - i); // [max, ..., 1]
  const asc = [...desc].reverse(); // [1, ..., max]

  switch (mode) {
    case 'DESC':
      return desc;
    case 'ASC':
      return asc;
    case 'DESC_ASC':
      return [...desc, ...asc.slice(1)];
    case 'ASC_DESC':
      return [...asc, ...desc.slice(1)];
  }
}
