import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { StandingsTable } from '../components/standings/StandingsTable';
import { StageLanesCollector, type LaneResult } from '../components/bowling/StandingsCollectors';
import { createStage, updateStage } from '../data/stagesRepo';
import { createTable } from '../data/tablesRepo';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import { distributeGroups, pickNoteTaker, splitIntoGroups } from '../domain/groupDistribution';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { usePlayers } from '../hooks/usePlayers';
import { useStage, useStages } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

export function BowlingReseedPage() {
  const { tournamentId, stageId } = useParams<{ tournamentId: string; stageId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const stage = useStage(tournamentId, stageId);
  const stages = useStages(tournamentId);
  const currentStageTables = useTables(tournamentId, stageId);
  const players = usePlayers();
  const { confirm, dialog } = useConfirmDialog();

  // Keyed by table id, across every stage played so far — summing every table's
  // contribution per player gives the true cumulative total for the whole night,
  // since a player sits at exactly one lane per stage.
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

  const cumulativeTotals: Record<string, number> = {};
  for (const result of Object.values(laneResults)) {
    for (const [playerId, total] of Object.entries(result.totalsByPlayer)) {
      cumulativeTotals[playerId] = (cumulativeTotals[playerId] ?? 0) + total;
    }
  }

  const standings = tournament.data.playerIds
    .map((playerId) => ({ playerId, total: cumulativeTotals[playerId] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  async function handleNextRound() {
    if (!tournamentId || !stageId || !uid || !stage) return;
    setSaving(true);
    try {
      const sortedIds = standings.map((s) => s.playerId);
      const laneCount = currentStageTables.length;
      const sizes = distributeGroups(sortedIds.length, laneCount);
      const newLanes = splitIntoGroups(sortedIds, sizes);

      const newStageId = await createStage(tournamentId, {
        index: stage.data.index + 1,
        name: `Runde ${stage.data.index + 2}`,
        status: 'active',
        reshuffleMode: 'RESEED_EACH_ROUND',
        roundCount: 1,
      });

      for (let i = 0; i < newLanes.length; i++) {
        await createTable(tournamentId, newStageId, {
          name: `Bane ${i + 1}`,
          playerIds: newLanes[i],
          noteTakerPlayerId: pickNoteTaker(newLanes[i], eligibleIds),
          noteTakerUid: uid,
          roundCount: 1,
          status: 'active',
        });
      }

      await updateStage(tournamentId, stageId, { status: 'complete' });
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
      <ScreenHeader title="Sammenlagt stilling" subtitle={`${tournament.data.name} — etter ${stage.data.name}`} />
      <div className="space-y-4 p-4">
        {stages.map((s) => (
          <StageLanesCollector key={s.id} tournamentId={tournamentId} stage={s} onResult={handleResult} />
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
