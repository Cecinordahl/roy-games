/** A standard 10-pin game score tops out at 300 (12 strikes in a row). */
export const MAX_BOWLING_SCORE = 300;

export function isValidBowlingScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= MAX_BOWLING_SCORE;
}
