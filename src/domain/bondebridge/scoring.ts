/**
 * Bondebridge round scoring.
 *
 * Hit the bid exactly: 10 + bid points (5 if the bid was zero).
 * Miss the bid: -2 points per trick of difference.
 */
export function roundScore(bid: number, tricks: number): number {
  if (bid !== tricks) return -2 * Math.abs(bid - tricks);
  return bid === 0 ? 5 : 10 + bid;
}
