import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { LaneRoundsCollector, type LaneResult } from '../components/bowling/StandingsCollectors';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { StandingsTable } from '../components/standings/StandingsTable';
import { reshuffleIntoNextStage } from '../data/bowlingReshuffle';
import { updateStage } from '../data/stagesRepo';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { usePlayers } from '../hooks/usePlayers';
import { useStage } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

export function BowlingReseedPage() {
  const { tournamentId, stageId } = useParams<{ tournamentId: string; stageId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const stage = useStage(tournamentId, stageId);
  const currentStageTables = useTables(tournamentId, stageId);
  const players = usePlayers();
  const { confirm, dialog } = useConfirmDialog();

  // Keyed by table id, this stage only — each reshuffle starts the next stage's
  // lanes at zero, so standings here never carry over previous rounds' totals.
  const [laneResults, setLaneResults] = useState<Record<string, LaneResult>>({});
  const [saving, setSaving] = useState(false);

  function handleResult(tableId: string, result: LaneResult) {
    setLaneResults((prev) => ({ ...prev, [tableId]: result }));
  }

  if (tournament === undefined || stage === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || stage === null || !tournamentId || !stageId) {
    return <p className="p-4">Fant ikke runden.</p>;
  }

  const playerNames = tournament.data.playerNames;
  const isOrganizer = !!uid && uid === tournament.data.organizerUid;
  const allComplete = currentStageTables.length > 0 && currentStageTables.every((t) => t.data.status === 'complete');
  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));

  const currentStagePlayerIds = currentStageTables.flatMap((t) => t.data.playerIds);
  const totalsByPlayer: Record<string, number> = {};
  currentStageTables.forEach((t) => Object.assign(totalsByPlayer, laneResults[t.id]?.totalsByPlayer ?? {}));

  const standings = currentStagePlayerIds
    .map((playerId) => ({ playerId, total: totalsByPlayer[playerId] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  async function handleNextRound() {
    if (!tournamentId || !stageId || !uid || !stage) return;
    setSaving(true);
    try {
      await reshuffleIntoNextStage({
        tournamentId,
        previousStageId: stageId,
        previousStageIndex: stage.data.index,
        reshuffleMode: 'RESEED_EACH_ROUND',
        roundCount: 1,
        sortedPlayerIds: standings.map((s) => s.playerId),
        laneCount: currentStageTables.length,
        organizerUid: uid,
        eligiblePlayerIds: eligibleIds,
      });
      navigate(`/t/${tournamentId}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (!tournamentId || !stageId) return;
    const ok = await confirm({
      title: 'Fullføre turnering?',
      message: 'Dette avslutter bowlingkvelden og viser pallen.',
      confirmLabel: 'Fullfør',
    });
    if (!ok) return;
    await updateStage(tournamentId, stageId, { status: 'complete' });
    await updateTournamentStatus(tournamentId, 'complete');
    navigate(`/t/${tournamentId}/podium`);
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader title="Stilling denne runden" subtitle={`${tournament.data.name} — ${stage.data.name}`} />
      <div className="space-y-4 p-4">
        {currentStageTables.map((t) => (
          <LaneRoundsCollector key={t.id} tournamentId={tournamentId} stageId={stageId} table={t} onResult={handleResult} />
        ))}

        <RetroPanel>
          <StandingsTable standings={standings} playerNames={playerNames} />
        </RetroPanel>

        {!allComplete && <p className="text-sm text-ink/60">Vent til alle baner er ferdige med denne runden.</p>}

        {isOrganizer && allComplete && (
          <div className="space-y-2">
            <RetroButton type="button" className="w-full" onClick={handleNextRound} disabled={saving}>
              Stokke om og lag neste runde
            </RetroButton>
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
