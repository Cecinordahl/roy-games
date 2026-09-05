import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import {db} from './firebase';
import type {PlayerDoc, WithId} from './types';

const playersCol = collection(db, 'players');

// Seed data from the spec — everyone can note-take except Randi.
const DEFAULT_PLAYER_NAMES = [
    'Marianne',
    'Cecilie',
    'Are',
    'Maxime',
    'Hanna',
    'Herman',
    'Anne-Ki',
    'Kissa',
    'Lotte',
    'Martin',
    'Tobias',
    'Rolf-Erik',
    'Nicolai',
    'Randi',
    'Trine-Lise',
    'Tommie',
    'Ingeborg',
    'Sigurd',
];

const DIACRITIC_MARKS = /[̀-ͯ]/g;

function slugifyName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITIC_MARKS, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Seeds the shared name bank the first time the app is used against an empty database.
 * Uses deterministic (slugified-name) doc ids rather than random ones: React 18
 * StrictMode double-invokes effects in dev, so two overlapping calls can both see an
 * empty collection before either has written — with deterministic ids that just
 * overwrites the same 16 docs twice instead of creating 32.
 */
export async function seedDefaultPlayersIfEmpty(): Promise<void> {
    const snap = await getDocs(playersCol);
    if (!snap.empty) return;
    const batch = writeBatch(db);
    for (const name of DEFAULT_PLAYER_NAMES) {
        batch.set(doc(playersCol, slugifyName(name)), {name, canBeNoteTaker: name !== 'Randi'} satisfies PlayerDoc);
    }
    await batch.commit();
}

export function subscribePlayers(onChange: (players: WithId<PlayerDoc>[]) => void): () => void {
    const q = query(playersCol, orderBy('name'));
    return onSnapshot(q, (snap) => {
        onChange(snap.docs.map((d) => ({id: d.id, data: d.data() as PlayerDoc})));
    });
}

export function addPlayer(player: PlayerDoc): Promise<string> {
    return addDoc(playersCol, player).then((ref) => ref.id);
}

export function updatePlayer(playerId: string, changes: Partial<PlayerDoc>): Promise<void> {
    return updateDoc(doc(playersCol, playerId), changes);
}

export function deletePlayer(playerId: string): Promise<void> {
    return deleteDoc(doc(playersCol, playerId));
}
