import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StageLanesCollector, type LaneResult } from '../components/bowling/StandingsCollectors';
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

function CumulativePodium({
  tournamentId,
  playerIds,
  playerNames,
}: {
  tournamentId: string;
  playerIds: string[];
  playerNames: Record<string, string>;
}) {
  const stages = useStages(tournamentId);
  const [laneResults, setLaneResults] = useState<Record<string, LaneResult>>({});

  function handleResult(tableId: string, result: LaneResult) {
    setLaneResults((prev) => ({ ...prev, [tableId]: result }));
  }

  const cumulativeTotals: Record<string, number> = {};
  for (const result of Object.values(laneResults)) {
    for (const [playerId, total] of Object.entries(result.totalsByPlayer)) {
      cumulativeTotals[playerId] = (cumulativeTotals[playerId] ?? 0) + total;
    }
  }
  const standings: Standing[] = playerIds
    .map((playerId) => ({ playerId, total: cumulativeTotals[playerId] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <>
      {stages.map((s) => (
        <StageLanesCollector key={s.id} tournamentId={tournamentId} stage={s} onResult={handleResult} />
      ))}
      <PodiumBody standings={standings} playerNames={playerNames} caption="Sammenlagt for hele kvelden" />
    </>
  );
}

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
  return <PodiumBody standings={standings} playerNames={playerNames} caption={tableName} />;
}

function PodiumBody({
  standings,
  playerNames,
  caption,
}: {
  standings: Standing[];
  playerNames: Record<string, string>;
  caption: string;
}) {
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
        <p className="mb-2 text-sm font-semibold">Full stilling — {caption}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {standings.map((s) => (
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
  const winnersTable = tables.find((t) => t.data.name.startsWith('Vinner')) ?? tables[0];

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || !tournamentId) return <p className="p-4">Fant ikke turneringen.</p>;

  const isReseedNight = tournament.data.game === 'bowling' && finalStage?.data.reshuffleMode === 'RESEED_EACH_ROUND';

  if (!isReseedNight && !winnersTable) return <p className="p-4">Ingen resultater å vise ennå.</p>;

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader title="Pallen" subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        {isReseedNight ? (
          <CumulativePodium
            tournamentId={tournamentId}
            playerIds={tournament.data.playerIds}
            playerNames={tournament.data.playerNames}
          />
        ) : (
          winnersTable && (
            <SingleTablePodium
              tournamentId={tournamentId}
              stageId={finalStage.id}
              tableId={winnersTable.id}
              tableName={winnersTable.data.name}
              playerIds={winnersTable.data.playerIds}
              playerNames={tournament.data.playerNames}
            />
          )
        )}
      </div>
    </div>
  );
}
