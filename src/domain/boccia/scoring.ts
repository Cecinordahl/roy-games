/**
 * Boccia round scoring: the closest player/team to the jack gets 1 point, or 2 if
 * they had both their own balls closer than everyone else's (`closestDoubled`).
 * Each participant also gets 1 bonus point per ball they landed directly on the
 * jack (0, 1, or 2 — a two-player team can each hit it once, a solo player can
 * hit it with both of their own balls), stacking with the closest-ball point.
 */
export function computeRoundScores(
  participantIds: readonly string[],
  closestId: string,
  closestDoubled: boolean,
  ballHitCounts: Readonly<Record<string, number>>,
): Record<string, number> {
  const closestPoints = closestDoubled ? 2 : 1;
  return Object.fromEntries(
    participantIds.map((id) => [id, (id === closestId ? closestPoints : 0) + (ballHitCounts[id] ?? 0)]),
  );
}
