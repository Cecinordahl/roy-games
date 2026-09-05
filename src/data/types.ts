import type { Timestamp } from 'firebase/firestore';
import type { RoundSequenceMode, SyncMode, TieBreakRule } from '../domain/types';

export interface PlayerDoc {
  name: string;
  canBeNoteTaker: boolean;
}

export type TournamentStatus = 'setup' | 'active' | 'complete';

export interface TournamentDoc {
  name: string;
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
  roundSequence: RoundSequenceMode;
  syncMode: SyncMode;
  tieBreakRule: TieBreakRule;
  status: StageStatus;
  /** How many advance per table out of this stage; set once the organizer confirms advancement. */
  advanceCount?: number;
}

export type TableStatus = 'active' | 'complete';

export interface TableDoc {
  name: string;
  /** Seating order. */
  playerIds: string[];
  noteTakerPlayerId: string;
  noteTakerUid: string;
  /** Full resolved sequence, frozen at table creation. */
  cardsPerRound: number[];
  status: TableStatus;
}

export interface RoundDoc {
  roundNumber: number;
  cards: number;
  bids: Record<string, number>;
  tricks: Record<string, number>;
  scores: Record<string, number>;
  completedAt: Timestamp;
}

export interface WithId<T> {
  id: string;
  data: T;
}
