import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateJoinCode } from './joinCode';
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
  organizerUid: string,
  playerNames: Record<string, string>,
): Promise<{ id: string; joinCode: string }> {
  const joinCode = await generateUniqueJoinCode();
  const ref = await addDoc(tournamentsCol, {
    name,
    joinCode,
    organizerUid,
    createdAt: serverTimestamp(),
    status: 'setup' satisfies TournamentStatus,
    playerIds: Object.keys(playerNames),
    playerNames,
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
