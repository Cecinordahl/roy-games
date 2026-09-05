import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateJoinCode } from './joinCode';
import type { GameType } from '../domain/types';
import type { TournamentDoc, TournamentStatus, WithId } from './types';

const tournamentsCol = collection(db, 'tournaments');

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateJoinCode();
    const snap = await getDocs(query(tournamentsCol, where('joinCode', '==', code), limit(1)));
    if (snap.empty) return code;
  }
  throw new Error('Kunne ikke generere en unik kode. Prøv igjen.');
}

export async function createTournament(
  name: string,
  game: GameType,
  organizerUid: string,
  playerNames: Record<string, string>,
  extra?: Partial<Pick<TournamentDoc, 'teamRosters' | 'eventDate'>>,
): Promise<{ id: string; joinCode: string }> {
  const joinCode = await generateUniqueJoinCode();
  const ref = await addDoc(tournamentsCol, {
    name,
    game,
    joinCode,
    organizerUid,
    createdAt: serverTimestamp(),
    status: 'setup' satisfies TournamentStatus,
    playerIds: Object.keys(playerNames),
    playerNames,
    ...extra,
  });
  return { id: ref.id, joinCode };
}

export function subscribeTournament(id: string, onChange: (t: WithId<TournamentDoc> | null) => void): () => void {
  return onSnapshot(doc(tournamentsCol, id), (snap) => {
    onChange(snap.exists() ? { id: snap.id, data: snap.data() as TournamentDoc } : null);
  });
}

export async function findTournamentByJoinCode(code: string): Promise<WithId<TournamentDoc> | null> {
  const snap = await getDocs(query(tournamentsCol, where('joinCode', '==', code.toUpperCase()), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, data: d.data() as TournamentDoc };
}

export function updateTournamentStatus(id: string, status: TournamentStatus): Promise<void> {
  return updateDoc(doc(tournamentsCol, id), { status });
}

/**
 * Edits a tournament's name and/or event date after the fact — e.g. setting a
 * date that wasn't filled in at creation, or fixing a typo in the name. Pass
 * `eventDate: null` to clear a previously-set date.
 */
export function updateTournamentInfo(
  id: string,
  changes: { name?: string; eventDate?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (changes.name !== undefined) payload.name = changes.name;
  if (changes.eventDate !== undefined) {
    payload.eventDate = changes.eventDate === null ? deleteField() : changes.eventDate;
  }
  return updateDoc(doc(tournamentsCol, id), payload);
}

/**
 * Every tournament ever created, newest first — not scoped to this device's local
 * history. Firestore rules already let any signed-in device read the tournaments
 * collection (per the join-code access model), so this isn't a new permission;
 * it's just only surfaced in the UI for the admin, who's the one who actually
 * needs to find and manage tournaments they didn't personally create or visit.
 */
export async function listAllTournaments(): Promise<WithId<TournamentDoc>[]> {
  const snap = await getDocs(query(tournamentsCol, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as TournamentDoc }));
}

/**
 * Deletes a tournament and every stage/table/round beneath it. There's no server-side
 * cascade in Firestore, so this walks the tree client-side — fine at this app's scale
 * (a handful of stages/tables per tournament).
 */
export async function deleteTournament(id: string): Promise<void> {
  const stagesSnap = await getDocs(collection(db, 'tournaments', id, 'stages'));
  for (const stageDoc of stagesSnap.docs) {
    const tablesSnap = await getDocs(collection(db, 'tournaments', id, 'stages', stageDoc.id, 'tables'));
    for (const tableDoc of tablesSnap.docs) {
      const roundsSnap = await getDocs(
        collection(db, 'tournaments', id, 'stages', stageDoc.id, 'tables', tableDoc.id, 'rounds'),
      );
      const batch = writeBatch(db);
      roundsSnap.docs.forEach((r) => batch.delete(r.ref));
      batch.delete(tableDoc.ref);
      await batch.commit();
    }
    await deleteDoc(stageDoc.ref);
  }
  await deleteDoc(doc(tournamentsCol, id));
}
