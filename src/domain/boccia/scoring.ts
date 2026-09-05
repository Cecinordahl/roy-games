/**
 * Boccia round scoring: the closest player/team to the jack gets 1 point; anyone
 * who hits the jack (white ball) directly gets 1 bonus point, stacking with the
 * closest-ball point if it's the same participant.
 */
export function computeRoundScores(
  participantIds: readonly string[],
  closestId: string,
  ballHitIds: readonly string[],
): Record<string, number> {
  const hitSet = new Set(ballHitIds);
  return Object.fromEntries(
    participantIds.map((id) => [id, (id === closestId ? 1 : 0) + (hitSet.has(id) ? 1 : 0)]),
  );
}
