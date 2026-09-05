import type { Timestamp } from 'firebase/firestore';
import type { GameType, ReshuffleMode, RoundSequenceMode, SyncMode, TieBreakRule } from '../domain/types';

export interface PlayerDoc {
  name: string;
  canBeNoteTaker: boolean;
}

export type TournamentStatus = 'setup' | 'active' | 'complete';

export interface TournamentDoc {
  name: string;
  game: GameType;
  joinCode: string;
  organizerUid: string;
  createdAt: Timestamp;
  status: TournamentStatus;
  /** Every scoring participant's id — individual player ids, or (Boccia team mode) synthetic team ids. */
  playerIds: string[];
  /** Snapshot of names at creation time so history reads correctly after the name bank changes.
   *  Also covers Boccia team names, keyed by the synthetic team id. */
  playerNames: Record<string, string>;
  /** Boccia team mode only: which real player ids sit on each team id, frozen at creation for history. */
  teamRosters?: Record<string, string[]>;
}

export type StageStatus = 'active' | 'complete';

export interface StageDoc {
  index: number;
  name: string;
  status: StageStatus;
  /** How many advance per table out of this stage; set once the organizer confirms advancement.
   *  Bondebridge, and bowling's GROUP_THEN_FINAL mode. Not used by RESEED_EACH_ROUND (nobody is cut). */
  advanceCount?: number;

  // --- Bondebridge-specific stage config ---
  roundSequence?: RoundSequenceMode;
  syncMode?: SyncMode;
  tieBreakRule?: TieBreakRule;

  // --- Bowling-specific stage config ---
  reshuffleMode?: ReshuffleMode;
  /** How many rounds this stage's lanes play before the organizer reshuffles/advances. */
  roundCount?: number;
}

export type TableStatus = 'active' | 'complete';

export interface TableDoc {
  name: string;
  /** Seating order (Bondebridge/Bowling), or the participant ids in Boccia. */
  playerIds: string[];
  noteTakerPlayerId: string;
  noteTakerUid: string;
  status: TableStatus;
  /** Bondebridge: full resolved card-count sequence, frozen at table creation. */
  cardsPerRound?: number[];
  /** Bowling: how many rounds this lane plays, frozen at creation. */
  roundCount?: number;
  /** Boccia only: first participant/team to reach this many points wins and ends the game. */
  targetScore?: number;
}

export interface RoundDoc {
  roundNumber: number;
  scores: Record<string, number>;
  completedAt: Timestamp;
  /** Bondebridge-only. */
  cards?: number;
  bids?: Record<string, number>;
  tricks?: Record<string, number>;
  /** Boccia-only: the raw inputs `scores` was derived from, kept for editing/history. */
  closestId?: string;
  /** True if the closest participant had both their balls closer than anyone else's (2 points instead of 1). */
  closestDoubled?: boolean;
  /** Per participant, how many of their balls hit the jack directly this round (0, 1, or 2). */
  ballHitCounts?: Record<string, number>;
}

export interface WithId<T> {
  id: string;
  data: T;
}
