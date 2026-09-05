import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'roy-games-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedActiveTable(noteTakerUid: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'tournaments/t1'), {
      name: 'Testturnering',
      joinCode: 'ABCDEF',
      organizerUid: 'org-uid',
      status: 'active',
      playerIds: ['p1'],
      playerNames: { p1: 'Ole' },
    });
    await setDoc(doc(db, 'tournaments/t1/stages/s1'), {
      index: 0,
      name: 'Gruppespill',
      roundSequence: 'DESC',
      syncMode: 'SYNCED',
      tieBreakRule: 'FEWEST_PENALTY',
      status: 'active',
    });
    await setDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1'), {
      name: 'Bord 1',
      playerIds: ['p1'],
      noteTakerPlayerId: 'p1',
      noteTakerUid,
      cardsPerRound: [10],
      status: 'active',
    });
  });
}

describe('firestore.rules', () => {
  it('lets a signed-in device create a tournament naming itself organizer', async () => {
    const db = testEnv.authenticatedContext('organizer-uid').firestore();
    await assertSucceeds(
      addDoc(collection(db, 'tournaments'), {
        name: 'Sommerturnering',
        joinCode: 'ABCDEF',
        organizerUid: 'organizer-uid',
        status: 'setup',
        playerIds: [],
        playerNames: {},
      }),
    );
  });

  it('rejects creating a tournament naming someone else as organizer', async () => {
    const db = testEnv.authenticatedContext('someone-uid').firestore();
    await assertFails(
      addDoc(collection(db, 'tournaments'), {
        name: 'Sommerturnering',
        joinCode: 'ABCDEF',
        organizerUid: 'other-uid',
        status: 'setup',
        playerIds: [],
        playerNames: {},
      }),
    );
  });

  it('rejects reads from a device with no auth at all', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'tournaments/t1')));
  });

  it('only the organizer can add a stage', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tournaments/t1'), {
        name: 'T',
        joinCode: 'ABCDEF',
        organizerUid: 'org-uid',
        status: 'setup',
        playerIds: [],
        playerNames: {},
      });
    });

    const organizerDb = testEnv.authenticatedContext('org-uid').firestore();
    await assertSucceeds(
      addDoc(collection(organizerDb, 'tournaments/t1/stages'), {
        index: 0,
        name: 'Gruppespill',
        roundSequence: 'DESC',
        syncMode: 'SYNCED',
        tieBreakRule: 'FEWEST_PENALTY',
        status: 'active',
      }),
    );

    const otherDb = testEnv.authenticatedContext('someone-else').firestore();
    await assertFails(
      addDoc(collection(otherDb, 'tournaments/t1/stages'), {
        index: 1,
        name: 'Sabotasje',
        roundSequence: 'DESC',
        syncMode: 'SYNCED',
        tieBreakRule: 'FEWEST_PENALTY',
        status: 'active',
      }),
    );
  });

  it('lets the current note taker write a round', async () => {
    await seedActiveTable('notetaker-uid');
    const db = testEnv.authenticatedContext('notetaker-uid').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1/rounds/1'), {
        roundNumber: 1,
        cards: 10,
        bids: { p1: 5 },
        tricks: { p1: 5 },
        scores: { p1: 15 },
      }),
    );
  });

  it('blocks a spectator (not the note taker) from writing a round', async () => {
    await seedActiveTable('notetaker-uid');
    const db = testEnv.authenticatedContext('spectator-uid').firestore();
    await assertFails(
      setDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1/rounds/1'), {
        roundNumber: 1,
        cards: 10,
        bids: { p1: 5 },
        tricks: { p1: 5 },
        scores: { p1: 15 },
      }),
    );
  });

  it('lets any signed-in device take over note-taking by changing only noteTakerUid', async () => {
    await seedActiveTable('old-uid');
    const db = testEnv.authenticatedContext('new-uid').firestore();
    await assertSucceeds(updateDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1'), { noteTakerUid: 'new-uid' }));
  });

  it('revokes the old note taker\'s round-write access after a takeover', async () => {
    await seedActiveTable('new-uid'); // table already handed over to new-uid
    const db = testEnv.authenticatedContext('old-uid').firestore();
    await assertFails(
      setDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1/rounds/1'), {
        roundNumber: 1,
        cards: 10,
        bids: {},
        tricks: {},
        scores: {},
      }),
    );
  });

  it('blocks a takeover attempt that also sneaks in other field changes', async () => {
    await seedActiveTable('old-uid');
    const db = testEnv.authenticatedContext('new-uid').firestore();
    await assertFails(
      updateDoc(doc(db, 'tournaments/t1/stages/s1/tables/tab1'), {
        noteTakerUid: 'new-uid',
        status: 'complete',
      }),
    );
  });
});
