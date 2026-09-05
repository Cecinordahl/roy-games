import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { RoundDoc, WithId } from './types';

const roundsCol = (tournamentId: string, stageId: string, tableId: string) =>
  collection(db, 'tournaments', tournamentId, 'stages', stageId, 'tables', tableId, 'rounds');

export function subscribeRounds(
  tournamentId: string,
  stageId: string,
  tableId: string,
  onChange: (rounds: WithId<RoundDoc>[]) => void,
): () => void {
  const q = query(roundsCol(tournamentId, stageId, tableId), orderBy('roundNumber'));
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => ({ id: d.id, data: d.data() as RoundDoc }))));
}

/**
 * Rounds are keyed by round number, so recording a new round and editing a completed
 * one are the same operation — a plain upsert. Downstream totals are always derived by
 * summing every round's `scores`, so there is nothing to separately "recompute".
 */
export function saveRound(
  tournamentId: string,
  stageId: string,
  tableId: string,
  roundNumber: number,
  round: Omit<RoundDoc, 'completedAt' | 'roundNumber'>,
): Promise<void> {
  return setDoc(doc(roundsCol(tournamentId, stageId, tableId), String(roundNumber)), {
    ...round,
    roundNumber,
    completedAt: serverTimestamp(),
  });
}

export function deleteRound(
  tournamentId: string,
  stageId: string,
  tableId: string,
  roundNumber: number,
): Promise<void> {
  return deleteDoc(doc(roundsCol(tournamentId, stageId, tableId), String(roundNumber)));
}
