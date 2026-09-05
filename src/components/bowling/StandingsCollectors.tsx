import { useEffect } from 'react';
import type { TableDoc, WithId } from '../../data/types';
import { computeStandings } from '../../domain/standings';
import { useRounds } from '../../hooks/useRounds';

export interface LaneResult {
  totalsByPlayer: Record<string, number>;
}

/**
 * One instance per lane (table), reporting its players' totals upward. Kept as a
 * component rather than a hook called in a loop so the number of hooks used stays
 * fixed per instance regardless of how many lanes a stage has.
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
