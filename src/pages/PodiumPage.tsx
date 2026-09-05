import { useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import type { Standing } from '../domain/types';
import { computeStandings } from '../domain/standings';
import { useRounds } from '../hooks/useRounds';
import { useStages } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

const MEDALS = ['🥇', '🥈', '🥉'];

function SingleTablePodium({
  tournamentId,
  stageId,
  tableId,
  tableName,
  playerIds,
  playerNames,
}: {
  tournamentId: string;
  stageId: string;
  tableId: string;
  tableName: string;
  playerIds: string[];
  playerNames: Record<string, string>;
}) {
  const rounds = useRounds(tournamentId, stageId, tableId);
  const standings = computeStandings(
    rounds.map((r) => r.data),
    playerIds,
  );
  const top3 = standings.slice(0, 3);

  return (
    <>
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
        <p className="mb-2 text-sm font-semibold">Full stilling — {tableName}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {standings.map((s: Standing) => (
            <li key={s.playerId}>
              {playerNames[s.playerId] ?? s.playerId} — {s.total} p
            </li>
          ))}
        </ol>
      </RetroPanel>
    </>
  );
}

export function PodiumPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const tournament = useTournament(tournamentId);
  const stages = useStages(tournamentId);
  const finalStage = stages[stages.length - 1];
  const tables = useTables(tournamentId, finalStage?.id);
  // "Vinnerbord"/"Vinnerbane" for elimination-style final stages; "Bane 1" is
  // always the top-ranked lane after a bowling re-seed reshuffle (see
  // reshuffleIntoNextStage) — everyone still plays, this is the closest thing
  // to a single "final table" to crown a podium from.
  const winnersTable =
    tables.find((t) => t.data.name.startsWith('Vinner')) ?? tables.find((t) => t.data.name === 'Bane 1') ?? tables[0];

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || !tournamentId) return <p className="p-4">Fant ikke turneringen.</p>;
  if (!winnersTable || !finalStage) return <p className="p-4">Ingen resultater å vise ennå.</p>;

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader title="Pallen" subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        <SingleTablePodium
          tournamentId={tournamentId}
          stageId={finalStage.id}
          tableId={winnersTable.id}
          tableName={winnersTable.data.name}
          playerIds={winnersTable.data.playerIds}
          playerNames={tournament.data.playerNames}
        />
      </div>
    </div>
  );
}
