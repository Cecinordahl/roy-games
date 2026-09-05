import { distributeGroups, pickNoteTaker, splitIntoGroups } from '../domain/groupDistribution';
import type { ReshuffleMode } from '../domain/types';
import { createStage, updateStage } from './stagesRepo';
import { createTable } from './tablesRepo';

interface ReshuffleParams {
  tournamentId: string;
  previousStageId: string;
  previousStageIndex: number;
  reshuffleMode: ReshuffleMode;
  roundCount: number;
  /** Players ranked best-first; split into lanes as contiguous rank blocks (best together, worst together). */
  sortedPlayerIds: string[];
  laneCount: number;
  organizerUid: string;
  eligiblePlayerIds: ReadonlySet<string>;
}

/**
 * Creates the next stage's lanes by rank — the top block of players forms lane 1,
 * the next block lane 2, and so on — and marks the previous stage complete.
 * Shared by bowling's "re-seed every round" page and the equivalent one-off
 * reshuffle action on the standings page for "group stage then final lane" mode.
 */
export async function reshuffleIntoNextStage({
  tournamentId,
  previousStageId,
  previousStageIndex,
  reshuffleMode,
  roundCount,
  sortedPlayerIds,
  laneCount,
  organizerUid,
  eligiblePlayerIds,
}: ReshuffleParams): Promise<void> {
  const sizes = distributeGroups(sortedPlayerIds.length, laneCount);
  const newLanes = splitIntoGroups(sortedPlayerIds, sizes);

  const newStageId = await createStage(tournamentId, {
    index: previousStageIndex + 1,
    name: `Runde ${previousStageIndex + 2}`,
    status: 'active',
    reshuffleMode,
    roundCount,
  });

  for (let i = 0; i < newLanes.length; i++) {
    await createTable(tournamentId, newStageId, {
      name: `Bane ${i + 1}`,
      playerIds: newLanes[i],
      noteTakerPlayerId: pickNoteTaker(newLanes[i], eligiblePlayerIds),
      noteTakerUid: organizerUid,
      roundCount,
      status: 'active',
    });
  }

  await updateStage(tournamentId, previousStageId, { status: 'complete' });
}
