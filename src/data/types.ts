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
  playerIds: string[];
  /** Snapshot of names at creation time so history reads correctly after the name bank changes. */
  playerNames: Record<string, string>;
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
  /** Seating order. */
  playerIds: string[];
  noteTakerPlayerId: string;
  noteTakerUid: string;
  status: TableStatus;
  /** Bondebridge: full resolved card-count sequence, frozen at table creation. */
  cardsPerRound?: number[];
  /** Bowling: how many rounds (games) this lane plays, frozen at table/lane creation. */
  roundCount?: number;
}

export interface RoundDoc {
  roundNumber: number;
  scores: Record<string, number>;
  completedAt: Timestamp;
  /** Bondebridge-only. */
  cards?: number;
  bids?: Record<string, number>;
  tricks?: Record<string, number>;
}

export interface WithId<T> {
  id: string;
  data: T;
}
