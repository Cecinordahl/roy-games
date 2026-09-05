import { useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { computeStandings } from '../domain/standings';
import { useRounds } from '../hooks/useRounds';
import { useStages } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

const MEDALS = ['🥇', '🥈', '🥉'];

export function PodiumPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournament = useTournament(tournamentId);
  const stages = useStages(tournamentId);
  const finalStage = stages[stages.length - 1];
  const tables = useTables(tournamentId, finalStage?.id);
  const winnersTable = tables.find((t) => t.data.name === 'Vinnerbord') ?? tables[0];
  const rounds = useRounds(tournamentId, finalStage?.id, winnersTable?.id);

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || !tournamentId) return <p className="p-4">Fant ikke turneringen.</p>;
  if (!winnersTable) return <p className="p-4">Ingen resultater å vise ennå.</p>;

  const standings = computeStandings(
    rounds.map((r) => r.data),
    winnersTable.data.playerIds,
  );
  const top3 = standings.slice(0, 3);
  const playerNames = tournament.data.playerNames;

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader title="Pallen" subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-3">
          {top3.map((s, i) => (
            <RetroPanel key={s.playerId} className="w-full max-w-xs border-4 bg-yellow text-center">
              <p className="text-3xl">{MEDALS[i]}</p>
              <p className="text-lg font-bold">{playerNames[s.playerId] ?? s.playerId}</p>
              <p className="text-sm text-ink/70">{s.total} poeng</p>
            </RetroPanel>
          ))}
        </div>

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Full stilling — {winnersTable.data.name}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {standings.map((s) => (
              <li key={s.playerId}>
                {playerNames[s.playerId] ?? s.playerId} — {s.total} p
              </li>
            ))}
          </ol>
        </RetroPanel>
      </div>
    </div>
  );
}
