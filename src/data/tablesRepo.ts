import { addDoc, collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { TableDoc, WithId } from './types';

const tablesCol = (tournamentId: string, stageId: string) =>
  collection(db, 'tournaments', tournamentId, 'stages', stageId, 'tables');

export function subscribeTables(
  tournamentId: string,
  stageId: string,
  onChange: (tables: WithId<TableDoc>[]) => void,
): () => void {
  return onSnapshot(query(tablesCol(tournamentId, stageId)), (snap) =>
    onChange(snap.docs.map((d) => ({ id: d.id, data: d.data() as TableDoc }))),
  );
}

export function subscribeTable(
  tournamentId: string,
  stageId: string,
  tableId: string,
  onChange: (t: WithId<TableDoc> | null) => void,
): () => void {
  return onSnapshot(doc(tablesCol(tournamentId, stageId), tableId), (snap) =>
    onChange(snap.exists() ? { id: snap.id, data: snap.data() as TableDoc } : null),
  );
}

export function createTable(tournamentId: string, stageId: string, table: TableDoc): Promise<string> {
  return addDoc(tablesCol(tournamentId, stageId), table).then((ref) => ref.id);
}

export function updateTable(
  tournamentId: string,
  stageId: string,
  tableId: string,
  changes: Partial<TableDoc>,
): Promise<void> {
  return updateDoc(doc(tablesCol(tournamentId, stageId), tableId), changes);
}

/** Anyone can press "Ta over notatføring" — a deliberate soft lock, see README. */
export function takeOverNoteTaking(
  tournamentId: string,
  stageId: string,
  tableId: string,
  noteTakerUid: string,
): Promise<void> {
  return updateTable(tournamentId, stageId, tableId, { noteTakerUid });
}
