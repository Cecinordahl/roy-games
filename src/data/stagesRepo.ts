import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { StageDoc, WithId } from './types';

const stagesCol = (tournamentId: string) => collection(db, 'tournaments', tournamentId, 'stages');

export function subscribeStages(tournamentId: string, onChange: (stages: WithId<StageDoc>[]) => void): () => void {
  const q = query(stagesCol(tournamentId), orderBy('index'));
  return onSnapshot(q, (snap) => onChange(snap.docs.map((d) => ({ id: d.id, data: d.data() as StageDoc }))));
}

export function subscribeStage(
  tournamentId: string,
  stageId: string,
  onChange: (s: WithId<StageDoc> | null) => void,
): () => void {
  return onSnapshot(doc(stagesCol(tournamentId), stageId), (snap) =>
    onChange(snap.exists() ? { id: snap.id, data: snap.data() as StageDoc } : null),
  );
}

export function createStage(tournamentId: string, stage: StageDoc): Promise<string> {
  return addDoc(stagesCol(tournamentId), stage).then((ref) => ref.id);
}

export function updateStage(tournamentId: string, stageId: string, changes: Partial<StageDoc>): Promise<void> {
  return updateDoc(doc(stagesCol(tournamentId), stageId), changes);
}
