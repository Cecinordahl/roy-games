import { useEffect, useState } from 'react';
import { subscribeStage, subscribeStages } from '../data/stagesRepo';
import type { StageDoc, WithId } from '../data/types';

export function useStages(tournamentId: string | undefined): WithId<StageDoc>[] {
  const [stages, setStages] = useState<WithId<StageDoc>[]>([]);

  useEffect(() => {
    if (!tournamentId) return;
    setStages([]);
    return subscribeStages(tournamentId, setStages);
  }, [tournamentId]);

  return stages;
}

export function useStage(tournamentId: string | undefined, stageId: string | undefined): WithId<StageDoc> | null | undefined {
  const [stage, setStage] = useState<WithId<StageDoc> | null | undefined>(undefined);

  useEffect(() => {
    if (!tournamentId || !stageId) return;
    setStage(undefined);
    return subscribeStage(tournamentId, stageId, setStage);
  }, [tournamentId, stageId]);

  return stage;
}
