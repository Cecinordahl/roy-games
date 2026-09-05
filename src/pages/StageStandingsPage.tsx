import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton, retroButtonClasses } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { StandingsTable } from '../components/standings/StandingsTable';
import { reshuffleIntoNextStage } from '../data/bowlingReshuffle';
import { updateStage } from '../data/stagesRepo';
import type { TableDoc, WithId } from '../data/types';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import { computeStandings } from '../domain/standings';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { usePlayers } from '../hooks/usePlayers';
import { useRounds } from '../hooks/useRounds';
import { useStage } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

function TableStandingsBlock({
  tournamentId,
  stageId,
  table,
  playerNames,
  onResult,
}: {
  tournamentId: string;
  stageId: string;
  table: WithId<TableDoc>;
  playerNames: Record<string, string>;
  onResult: (tableId: string, totalsByPlayer: Record<string, number>) => void;
}) {
  const rounds = useRounds(tournamentId, stageId, table.id);
  const standings = computeStandings(
    rounds.map((r) => r.data),
    table.data.playerIds,
  );
  const totalsByPlayer = Object.fromEntries(standings.map((s) => [s.playerId, s.total]));
  const key = JSON.stringify(totalsByPlayer);

  useEffect(() => {
    onResult(table.id, totalsByPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, key]);

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
  const players = usePlayers();
  const { confirm, dialog } = useConfirmDialog();
  const [laneTotals, setLaneTotals] = useState<Record<string, Record<string, number>>>({});
  const [reshuffling, setReshuffling] = useState(false);

  function handleResult(tableId: string, totalsByPlayer: Record<string, number>) {
    setLaneTotals((prev) => ({ ...prev, [tableId]: totalsByPlayer }));
  }

  if (tournament === undefined || stage === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || stage === null || !tournamentId || !stageId) {
    return <p className="p-4">Fant ikke tabellen.</p>;
  }

  // Re-seed bowling stages get their own cumulative-standings-and-reshuffle page.
  if (stage.data.reshuffleMode === 'RESEED_EACH_ROUND') {
    return <Navigate to={`/t/${tournamentId}/stages/${stageId}/reseed`} replace />;
  }

  const isOrganizer = !!uid && uid === tournament.data.organizerUid;
  const isBowling = tournament.data.game === 'bowling';
  const allComplete = tables.length > 0 && tables.every((t) => t.data.status === 'complete');
  const laneWord = isBowling ? 'bane' : 'bord';
  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));

  const currentStagePlayerIds = tables.flatMap((t) => t.data.playerIds);
  const totalsByPlayer: Record<string, number> = {};
  tables.forEach((t) => Object.assign(totalsByPlayer, laneTotals[t.id] ?? {}));
  const rankedPlayerIds = [...currentStagePlayerIds].sort(
    (a, b) => (totalsByPlayer[b] ?? 0) - (totalsByPlayer[a] ?? 0),
  );

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

  async function handleReshuffle() {
    if (!tournamentId || !stageId || !uid || !stage) return;
    setReshuffling(true);
    try {
      await reshuffleIntoNextStage({
        tournamentId,
        previousStageId: stageId,
        previousStageIndex: stage.data.index,
        reshuffleMode: 'GROUP_THEN_FINAL',
        roundCount: stage.data.roundCount ?? 1,
        sortedPlayerIds: rankedPlayerIds,
        laneCount: tables.length,
        organizerUid: uid,
        eligiblePlayerIds: eligibleIds,
      });
      navigate(`/t/${tournamentId}`);
    } finally {
      setReshuffling(false);
    }
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
            onResult={handleResult}
          />
        ))}

        {tables.length === 0 && <p className="text-sm text-ink/60">Ingen {laneWord} i denne runden.</p>}

        {isOrganizer && allComplete && stage.data.status !== 'complete' && (
          <div className="space-y-2">
            {isBowling && (
              <RetroButton type="button" className="w-full" onClick={handleReshuffle} disabled={reshuffling}>
                Legg til runde med nye lag (beste sammen, dårligste sammen)
              </RetroButton>
            )}
            <Link
              to={`/t/${tournamentId}/stages/${stageId}/advance`}
              className={retroButtonClasses(isBowling ? 'secondary' : 'primary', 'block w-full')}
            >
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
