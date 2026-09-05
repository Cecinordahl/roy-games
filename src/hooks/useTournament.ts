import { useEffect, useState } from 'react';
import { subscribeTournament } from '../data/tournamentsRepo';
import type { TournamentDoc, WithId } from '../data/types';

export function useTournament(tournamentId: string | undefined): WithId<TournamentDoc> | null | undefined {
  const [tournament, setTournament] = useState<WithId<TournamentDoc> | null | undefined>(undefined);

  useEffect(() => {
    if (!tournamentId) return;
    setTournament(undefined);
    return subscribeTournament(tournamentId, setTournament);
  }, [tournamentId]);

  return tournament;
}
