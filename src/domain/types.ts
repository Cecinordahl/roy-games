// Game-agnostic domain types shared across tournament/table/scoring concepts.
// Bondebridge-specific rules live in `./bondebridge`.

export interface Player {
  id: string;
  name: string;
  canBeNoteTaker: boolean;
}

export type RoundSequenceMode = 'DESC' | 'ASC' | 'DESC_ASC' | 'ASC_DESC';
export type SyncMode = 'SYNCED' | 'INDEPENDENT';
export type TieBreakRule = 'FEWEST_PENALTY' | 'HIGHEST_SUCCESSFUL_BID' | 'BOTH_ADVANCE';

/** A single completed round's bids/tricks/scores, keyed by player id. */
export interface RoundLike {
  bids: Record<string, number>;
  tricks: Record<string, number>;
  scores: Record<string, number>;
}

export interface Standing {
  playerId: string;
  total: number;
}
