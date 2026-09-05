import { useEffect, useState } from 'react';
import { subscribePlayers } from '../data/playersRepo';
import type { PlayerDoc, WithId } from '../data/types';

export function usePlayers(): WithId<PlayerDoc>[] {
  const [players, setPlayers] = useState<WithId<PlayerDoc>[]>([]);
  useEffect(() => subscribePlayers(setPlayers), []);
  return players;
}
