import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BocciaRoundForm } from '../components/round/BocciaRoundForm';
import { RoundList } from '../components/round/RoundList';
import { StandingsTable } from '../components/standings/StandingsTable';
import { saveRound } from '../data/roundsRepo';
import { takeOverNoteTaking, updateTable } from '../data/tablesRepo';
import { computeRoundScores } from '../domain/boccia/scoring';
import { computeStandings } from '../domain/standings';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useRounds } from '../hooks/useRounds';
import { useTable } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

export function BocciaCourtPage() {
  const { tournamentId, stageId, tableId } = useParams<{
    tournamentId: string;
    stageId: string;
    tableId: string;
  }>();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const table = useTable(tournamentId, stageId, tableId);
  const rounds = useRounds(tournamentId, stageId, tableId);
  const [editingRoundNumber, setEditingRoundNumber] = useState<number | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const standings = useMemo(
    () => computeStandings(rounds.map((r) => r.data), table?.data.playerIds ?? []),
    [rounds, table],
  );

  if (tournament === undefined || table === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || table === null || !tournamentId || !stageId || !tableId) {
    return <p className="p-4">Fant ikke banen.</p>;
  }

  const participantNames = tournament.data.playerNames;
  const isNoteTaker = !!uid && uid === table.data.noteTakerUid;
  const totalRounds = table.data.roundCount ?? 1;
  const nextRoundNumber = rounds.length + 1;
  const isComplete = table.data.status === 'complete';

  const editingRound =
    editingRoundNumber !== null ? rounds.find((r) => r.data.roundNumber === editingRoundNumber) : undefined;
  const activeRoundNumber = editingRoundNumber ?? (isComplete ? null : nextRoundNumber);

  async function handleTakeOver() {
    if (!uid || !tournamentId || !stageId || !tableId) return;
    await takeOverNoteTaking(tournamentId, stageId, tableId, uid);
  }

  async function handleSaveRound(closestId: string, ballHitIds: string[]) {
    if (!tournamentId || !stageId || !tableId || !table || activeRoundNumber === null) return;
    const scores = computeRoundScores(table.data.playerIds, closestId, ballHitIds);

    if (isComplete && editingRoundNumber !== null) {
      const hypotheticalRounds = rounds.map((r) =>
        r.data.roundNumber === editingRoundNumber ? { ...r.data, scores } : r.data,
      );
      const before = standings.map((s) => s.playerId);
      const after = computeStandings(hypotheticalRounds, table.data.playerIds).map((s) => s.playerId);
      const changed = before.some((id, i) => id !== after[i]);
      if (changed) {
        const ok = await confirm({
          title: 'Endrer sluttresultatet',
          message: 'Denne endringen påvirker sluttresultatet. Lagre likevel?',
          confirmLabel: 'Lagre likevel',
          danger: true,
        });
        if (!ok) return;
      }
    }

    await saveRound(tournamentId, stageId, tableId, activeRoundNumber, { closestId, ballHitIds, scores });

    if (!isComplete && activeRoundNumber === totalRounds) {
      await updateTable(tournamentId, stageId, tableId, { status: 'complete' });
    }
    setEditingRoundNumber(null);
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader
        title={table.data.name}
        subtitle={`${tournament.data.name} — runde ${Math.min(rounds.length + 1, totalRounds)} av ${totalRounds}`}
      />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <p className="text-sm">
            Notatfører:{' '}
            <strong>{participantNames[table.data.noteTakerPlayerId] ?? table.data.noteTakerPlayerId}</strong>
          </p>
          {!isNoteTaker && (
            <RetroButton type="button" variant="secondary" className="mt-2" onClick={handleTakeOver}>
              Ta over notatføring
            </RetroButton>
          )}
        </RetroPanel>

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Stilling</p>
          <StandingsTable standings={standings} playerNames={participantNames} />
        </RetroPanel>

        {isNoteTaker && activeRoundNumber !== null && (
          <BocciaRoundForm
            key={activeRoundNumber}
            participantIds={table.data.playerIds}
            participantNames={participantNames}
            initialClosestId={editingRound?.data.closestId}
            initialBallHitIds={editingRound?.data.ballHitIds}
            onSave={handleSaveRound}
            onCancel={editingRoundNumber !== null ? () => setEditingRoundNumber(null) : undefined}
          />
        )}

        {isComplete && editingRoundNumber === null && (
          <RetroPanel className="bg-sage/30 text-sm">Alle runder er spilt.</RetroPanel>
        )}

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Runder</p>
          <RoundList
            rounds={rounds}
            playerIds={table.data.playerIds}
            playerNames={participantNames}
            canEdit={isNoteTaker}
            onEdit={setEditingRoundNumber}
          />
        </RetroPanel>
      </div>
      {dialog}
    </div>
  );
}
