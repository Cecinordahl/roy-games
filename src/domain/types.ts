// Game-agnostic domain types shared across tournament/table/scoring concepts.
// Bondebridge-specific rules live in `./bondebridge`.

export interface Player {
  id: string;
  name: string;
  canBeNoteTaker: boolean;
}

export type GameType = 'bondebridge' | 'bowling' | 'boccia';

/** Whether Boccia participants are individual players or ad-hoc teams of players. */
export type BocciaParticipantMode = 'players' | 'teams';

export type RoundSequenceMode = 'DESC' | 'ASC' | 'DESC_ASC' | 'ASC_DESC';
export type SyncMode = 'SYNCED' | 'INDEPENDENT';
export type TieBreakRule = 'FEWEST_PENALTY' | 'HIGHEST_SUCCESSFUL_BID' | 'BOTH_ADVANCE';

/** How a bowling tournament reshuffles lanes between rounds. */
export type ReshuffleMode = 'RESEED_EACH_ROUND' | 'GROUP_THEN_FINAL';

/**
 * A single completed round's scores, keyed by player id. `bids`/`tricks` only
 * apply to Bondebridge rounds (used for its tie-break rules) — bowling rounds
 * carry a direct score with no bid/tricks breakdown.
 */
export interface RoundLike {
  scores: Record<string, number>;
  bids?: Record<string, number>;
  tricks?: Record<string, number>;
}

export interface Standing {
  playerId: string;
  total: number;
}
