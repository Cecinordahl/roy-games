import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton, retroButtonClasses } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { StandingsTable } from '../components/standings/StandingsTable';
import { updateStage } from '../data/stagesRepo';
import type { TableDoc, WithId } from '../data/types';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import { computeStandings } from '../domain/standings';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useRounds } from '../hooks/useRounds';
import { useStage } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

function TableStandingsBlock({
  tournamentId,
  stageId,
  table,
  playerNames,
}: {
  tournamentId: string;
  stageId: string;
  table: WithId<TableDoc>;
  playerNames: Record<string, string>;
}) {
  const rounds = useRounds(tournamentId, stageId, table.id);
  const standings = computeStandings(
    rounds.map((r) => r.data),
    table.data.playerIds,
  );
  return (
    <RetroPanel>
      <p className="mb-2 text-sm font-semibold">{table.data.name}</p>
      <StandingsTable standings={standings} playerNames={playerNames} />
    </RetroPanel>
  );
}

export function StageStandingsPage() {
  const { tournamentId, stageId } = useParams<{ tournamentId: string; stageId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const stage = useStage(tournamentId, stageId);
  const tables = useTables(tournamentId, stageId);
  const { confirm, dialog } = useConfirmDialog();

  if (tournament === undefined || stage === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || stage === null || !tournamentId || !stageId) {
    return <p className="p-4">Fant ikke tabellen.</p>;
  }

  const isOrganizer = !!uid && uid === tournament.data.organizerUid;
  const allComplete = tables.length > 0 && tables.every((t) => t.data.status === 'complete');

  async function handleFinish() {
    if (!tournamentId || !stageId) return;
    const ok = await confirm({
      title: 'Fullføre turnering?',
      message: 'Dette avslutter turneringen og viser pallen. Du kan ikke gå tilbake til gruppespillet etterpå.',
      confirmLabel: 'Fullfør',
    });
    if (!ok) return;
    await updateStage(tournamentId, stageId, { status: 'complete' });
    await updateTournamentStatus(tournamentId, 'complete');
    navigate(`/t/${tournamentId}/podium`);
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} />
      <ScreenHeader title={stage.data.name} subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        {tables.map((t) => (
          <TableStandingsBlock
            key={t.id}
            tournamentId={tournamentId}
            stageId={stageId}
            table={t}
            playerNames={tournament.data.playerNames}
          />
        ))}

        {tables.length === 0 && <p className="text-sm text-ink/60">Ingen bord i denne runden.</p>}

        {isOrganizer && allComplete && stage.data.status !== 'complete' && (
          <div className="space-y-2">
            <Link to={`/t/${tournamentId}/stages/${stageId}/advance`} className={retroButtonClasses('primary', 'block w-full')}>
              Foreslå neste runde
            </Link>
            <RetroButton type="button" variant="secondary" className="w-full" onClick={handleFinish}>
              Fullfør turnering
            </RetroButton>
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
