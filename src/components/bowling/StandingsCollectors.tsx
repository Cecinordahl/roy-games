import { useEffect } from 'react';
import type { StageDoc, TableDoc, WithId } from '../../data/types';
import { computeStandings } from '../../domain/standings';
import { useRounds } from '../../hooks/useRounds';
import { useTables } from '../../hooks/useTables';

export interface LaneResult {
  totalsByPlayer: Record<string, number>;
}

/**
 * One instance per lane (table), reporting its players' totals upward. Kept as a
 * component rather than a hook called in a loop so the number of hooks used stays
 * fixed per instance regardless of how many lanes/stages exist.
 */
export function LaneRoundsCollector({
  tournamentId,
  stageId,
  table,
  onResult,
}: {
  tournamentId: string;
  stageId: string;
  table: WithId<TableDoc>;
  onResult: (tableId: string, result: LaneResult) => void;
}) {
  const rounds = useRounds(tournamentId, stageId, table.id);
  const standings = computeStandings(
    rounds.map((r) => r.data),
    table.data.playerIds,
  );
  const totalsByPlayer = Object.fromEntries(standings.map((s) => [s.playerId, s.total]));
  const key = JSON.stringify(totalsByPlayer);

  useEffect(() => {
    onResult(table.id, { totalsByPlayer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, key]);

  return null;
}

/**
 * One instance per stage: fetches that stage's lanes, then collects each lane's
 * totals. Render one of these per stage to build a cumulative per-player total
 * across the whole tournament (bowling's "re-seed every round" mode needs this
 * since a player sits at a different lane each stage).
 */
export function StageLanesCollector({
  tournamentId,
  stage,
  onResult,
}: {
  tournamentId: string;
  stage: WithId<StageDoc>;
  onResult: (tableId: string, result: LaneResult) => void;
}) {
  const tables = useTables(tournamentId, stage.id);
  return (
    <>
      {tables.map((t) => (
        <LaneRoundsCollector key={t.id} tournamentId={tournamentId} stageId={stage.id} table={t} onResult={onResult} />
      ))}
    </>
  );
}
