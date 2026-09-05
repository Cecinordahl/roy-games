import { useEffect, useState } from 'react';
import { subscribeRounds } from '../data/roundsRepo';
import type { RoundDoc, WithId } from '../data/types';

export function useRounds(
  tournamentId: string | undefined,
  stageId: string | undefined,
  tableId: string | undefined,
): WithId<RoundDoc>[] {
  const [rounds, setRounds] = useState<WithId<RoundDoc>[]>([]);

  useEffect(() => {
    if (!tournamentId || !stageId || !tableId) return;
    setRounds([]);
    return subscribeRounds(tournamentId, stageId, tableId, setRounds);
  }, [tournamentId, stageId, tableId]);

  return rounds;
}
