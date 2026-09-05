import type { RoundLike, Standing, TieBreakRule } from './types';

/** Ranks players by running total, descending. Safe to call mid-round (partial rounds included). */
export function computeStandings(rounds: readonly RoundLike[], playerIds: readonly string[]): Standing[] {
  const totals = new Map(playerIds.map((id) => [id, 0]));
  for (const round of rounds) {
    for (const id of playerIds) {
      totals.set(id, (totals.get(id) ?? 0) + (round.scores[id] ?? 0));
    }
  }
  return playerIds
    .map((playerId) => ({ playerId, total: totals.get(playerId) ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Sum of the absolute value of a player's negative round scores. Lower is better. */
export function penaltyPoints(rounds: readonly RoundLike[], playerId: string): number {
  return rounds.reduce((sum, round) => {
    const score = round.scores[playerId] ?? 0;
    return score < 0 ? sum + Math.abs(score) : sum;
  }, 0);
}

/** Sum of bids across only the rounds where the player hit their bid exactly. Higher is better. */
export function highestSuccessfulBidTotal(rounds: readonly RoundLike[], playerId: string): number {
  return rounds.reduce((sum, round) => {
    const bid = round.bids?.[playerId];
    const tricks = round.tricks?.[playerId];
    return bid !== undefined && bid === tricks ? sum + bid : sum;
  }, 0);
}

export interface TieGroup {
  total: number;
  playerIds: string[];
}

/**
 * If the boundary between advancing and not-advancing falls inside a tie,
 * returns the group of tied players straddling it. Otherwise undefined.
 */
export function findTieAtCutoff(standings: readonly Standing[], advanceCount: number): TieGroup | undefined {
  if (advanceCount <= 0 || advanceCount >= standings.length) return undefined;
  const boundaryTotal = standings[advanceCount - 1].total;
  const tied = standings.filter((s) => s.total === boundaryTotal);
  return tied.length > 1 ? { total: boundaryTotal, playerIds: tied.map((s) => s.playerId) } : undefined;
}

export type TieResolution = { resolved: true; order: string[] } | { resolved: false; tied: string[] };

/**
 * Applies the stage's tie-break rule to a tied group. `BOTH_ADVANCE` always resolves
 * (order within the group doesn't matter, everyone advances). The other two rules can
 * still leave players tied (e.g. two players who never hit a bid both score 0 on
 * HIGHEST_SUCCESSFUL_BID) — that's surfaced as `resolved: false` for a manual choice,
 * not silently broken.
 */
export function resolveTie(tieGroup: TieGroup, rounds: readonly RoundLike[], rule: TieBreakRule): TieResolution {
  if (rule === 'BOTH_ADVANCE') {
    return { resolved: true, order: [...tieGroup.playerIds] };
  }

  const metric =
    rule === 'FEWEST_PENALTY'
      ? (id: string) => -penaltyPoints(rounds, id)
      : (id: string) => highestSuccessfulBidTotal(rounds, id);

  const scored = tieGroup.playerIds
    .map((id) => ({ id, value: metric(id) }))
    .sort((a, b) => b.value - a.value);

  const stillTied = scored.some((s, i) => i > 0 && s.value === scored[i - 1].value);
  if (stillTied) {
    return { resolved: false, tied: [...tieGroup.playerIds] };
  }
  return { resolved: true, order: scored.map((s) => s.id) };
}
