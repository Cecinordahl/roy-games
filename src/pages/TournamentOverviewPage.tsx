import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton, retroButtonClasses } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TrashIcon } from '../components/layout/TrashIcon';
import { forgetTournament } from '../data/localHistory';
import { deleteTournament } from '../data/tournamentsRepo';
import type { TableDoc, WithId } from '../data/types';
import { computeStandings } from '../domain/standings';
import type { GameType } from '../domain/types';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useRounds } from '../hooks/useRounds';
import { useStages } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

const TABLE_LINK_SEGMENT: Record<GameType, string> = {
  bondebridge: 'tables',
  bowling: 'lanes',
  boccia: 'court',
};

function TableSummaryCard({
  tournamentId,
  stageId,
  table,
  playerNames,
  game,
}: {
  tournamentId: string;
  stageId: string;
  table: WithId<TableDoc>;
  playerNames: Record<string, string>;
  game: GameType;
}) {
  const rounds = useRounds(tournamentId, stageId, table.id);
  const standings = computeStandings(
    rounds.map((r) => r.data),
    table.data.playerIds,
  );
  const leader = standings[0];
  const totalRounds = table.data.cardsPerRound?.length ?? table.data.roundCount;
  const linkPath = `/t/${tournamentId}/stages/${stageId}/${TABLE_LINK_SEGMENT[game]}/${table.id}`;

  return (
    <Link to={linkPath}>
      <RetroPanel className="hover:bg-sage/20">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{table.data.name}</p>
          <span className="text-xs text-ink/60">
            {table.data.targetScore !== undefined
              ? `til ${table.data.targetScore} p`
              : `${rounds.length}/${totalRounds ?? 1} runder`}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink/60">
          {table.data.playerIds.map((id) => playerNames[id] ?? id).join(', ')}
        </p>
        {leader && (
          <p className="mt-1 text-sm">
            I ledelsen: {playerNames[leader.playerId] ?? leader.playerId} ({leader.total} p)
          </p>
        )}
      </RetroPanel>
    </Link>
  );
}

export function TournamentOverviewPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const tournament = useTournament(tournamentId);
  const stages = useStages(tournamentId);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const currentStage = stages.find((s) => s.id === activeStageId) ?? stages[stages.length - 1];
  const tables = useTables(tournamentId, currentStage?.id);

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null) return <p className="p-4">Fant ikke turneringen.</p>;
  if (!tournamentId) return null;

  const playerNames = tournament.data.playerNames;
  const allTablesComplete = tables.length > 0 && tables.every((t) => t.data.status === 'complete');
  const isBowling = tournament.data.game === 'bowling';
  const isBoccia = tournament.data.game === 'boccia';
  const isReseedMode = isBowling && currentStage?.data.reshuffleMode === 'RESEED_EACH_ROUND';
  const laneWord = isBowling ? 'baner' : isBoccia ? 'runder' : 'bord';
  const setupPath = isBowling
    ? `/t/${tournamentId}/setup-bowling`
    : isBoccia
      ? '/tournaments/new-boccia'
      : `/t/${tournamentId}/setup`;
  const standingsPath = currentStage
    ? isReseedMode
      ? `/t/${tournamentId}/stages/${currentStage.id}/reseed`
      : `/t/${tournamentId}/stages/${currentStage.id}/standings`
    : '';

  async function handleDeleteTournament() {
    if (!tournamentId) return;
    const ok = await confirm({
      title: 'Slette turneringen?',
      message: `Dette sletter «${tournament?.data.name}» og all historikk (grupper, bord og runder) permanent. Dette kan ikke angres.`,
      confirmLabel: 'Slett for godt',
      danger: true,
    });
    if (!ok) return;
    await deleteTournament(tournamentId);
    forgetTournament(tournamentId);
    navigate('/');
  }

  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title={tournament.data.name} subtitle={`Kode: ${tournament.data.joinCode}`} />
      <div className="space-y-4 p-4">
        {tournament.data.status === 'setup' && (
          <RetroPanel className="bg-yellow">
            <p className="text-sm">Turneringen er ikke satt i gang ennå.</p>
            <Link className="underline" to={setupPath}>
              Fortsett oppsett
            </Link>
          </RetroPanel>
        )}

        {stages.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`border-2 border-ink px-2 py-1 text-xs font-semibold ${
                  (currentStage?.id ?? '') === s.id ? 'bg-sage' : 'bg-surface'
                }`}
                onClick={() => setActiveStageId(s.id)}
              >
                {s.data.name}
              </button>
            ))}
          </div>
        )}

        {currentStage && (
          <div className="space-y-2">
            {tables.map((t) => (
              <TableSummaryCard
                key={t.id}
                tournamentId={tournamentId}
                stageId={currentStage.id}
                table={t}
                playerNames={playerNames}
                game={tournament.data.game}
              />
            ))}

            <Link to={standingsPath} className={retroButtonClasses('secondary', 'block w-full')}>
              Se full tabell
            </Link>

            {allTablesComplete && currentStage.data.status !== 'complete' && (
              <p className="text-sm text-ink/70">Alle {laneWord} er ferdige. Gå til tabellen for å gå videre.</p>
            )}
          </div>
        )}

        {tournament.data.status === 'complete' && (
          <Link to={`/t/${tournamentId}/podium`} className={retroButtonClasses('primary', 'block w-full')}>
            Vis resultater
          </Link>
        )}

        {isAdmin && (
          <RetroButton
            type="button"
            variant="danger"
            className="flex w-full items-center justify-center gap-2"
            onClick={handleDeleteTournament}
          >
            <TrashIcon className="h-5 w-5" />
            Slett turnering
          </RetroButton>
        )}
      </div>
      {dialog}
    </div>
  );
}
