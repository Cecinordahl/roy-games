import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { BowlingScoreForm } from '../components/round/BowlingScoreForm';
import { RoundList } from '../components/round/RoundList';
import { StandingsTable } from '../components/standings/StandingsTable';
import { saveRound } from '../data/roundsRepo';
import { takeOverNoteTaking, updateTable } from '../data/tablesRepo';
import { computeStandings } from '../domain/standings';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useRounds } from '../hooks/useRounds';
import { useTable } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

export function BowlingLanePage() {
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

  const playerNames = tournament.data.playerNames;
  const isNoteTaker = !!uid && uid === table.data.noteTakerUid;
  // Undefined means "no preset" — the note taker plays as many rounds as they
  // want and finishes the lane manually (see handleFinishLane).
  const totalRounds = table.data.roundCount;
  const nextRoundNumber = rounds.length + 1;
  const isLaneComplete = table.data.status === 'complete';

  const editingRound =
    editingRoundNumber !== null ? rounds.find((r) => r.data.roundNumber === editingRoundNumber) : undefined;
  const activeRoundNumber = editingRoundNumber ?? (isLaneComplete ? null : nextRoundNumber);

  async function handleTakeOver() {
    if (!uid || !tournamentId || !stageId || !tableId) return;
    await takeOverNoteTaking(tournamentId, stageId, tableId, uid);
  }

  async function handleAddRound() {
    if (!tournamentId || !stageId || !tableId) return;
    await updateTable(tournamentId, stageId, tableId, {
      status: 'active',
      ...(totalRounds !== undefined ? { roundCount: totalRounds + 1 } : {}),
    });
  }

  async function handleFinishLane() {
    if (!tournamentId || !stageId || !tableId) return;
    await updateTable(tournamentId, stageId, tableId, { status: 'complete' });
  }

  async function handleSaveRound(scores: Record<string, number>) {
    if (!tournamentId || !stageId || !tableId || !table || activeRoundNumber === null) return;

    if (isLaneComplete && editingRoundNumber !== null) {
      const hypotheticalRounds = rounds.map((r) =>
        r.data.roundNumber === editingRoundNumber ? { ...r.data, scores } : r.data,
      );
      const before = standings.map((s) => s.playerId);
      const after = computeStandings(hypotheticalRounds, table.data.playerIds).map((s) => s.playerId);
      const changed = before.some((id, i) => id !== after[i]);
      if (changed) {
        const ok = await confirm({
          title: 'Endrer sluttresultatet',
          message: 'Denne endringen påvirker sluttresultatet for banen. Lagre likevel?',
          confirmLabel: 'Lagre likevel',
          danger: true,
        });
        if (!ok) return;
      }
    }

    await saveRound(tournamentId, stageId, tableId, activeRoundNumber, { scores });

    if (!isLaneComplete && totalRounds !== undefined && activeRoundNumber === totalRounds) {
      await updateTable(tournamentId, stageId, tableId, { status: 'complete' });
    }
    setEditingRoundNumber(null);
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader
        title={table.data.name}
        subtitle={
          totalRounds !== undefined
            ? `${tournament.data.name} — runde ${Math.min(rounds.length + 1, totalRounds)} av ${totalRounds}`
            : `${tournament.data.name} — runde ${rounds.length + 1}`
        }
      />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <p className="text-sm">
            Notatfører: <strong>{playerNames[table.data.noteTakerPlayerId] ?? table.data.noteTakerPlayerId}</strong>
          </p>
          {!isNoteTaker && (
            <RetroButton type="button" variant="secondary" className="mt-2" onClick={handleTakeOver}>
              Ta over notatføring
            </RetroButton>
          )}
        </RetroPanel>

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Stilling</p>
          <StandingsTable standings={standings} playerNames={playerNames} />
        </RetroPanel>

        {isNoteTaker && activeRoundNumber !== null && (
          <BowlingScoreForm
            key={activeRoundNumber}
            playerIds={table.data.playerIds}
            playerNames={playerNames}
            initialScores={editingRound?.data.scores}
            onSave={handleSaveRound}
            onCancel={editingRoundNumber !== null ? () => setEditingRoundNumber(null) : undefined}
          />
        )}

        {isNoteTaker && !isLaneComplete && totalRounds === undefined && rounds.length > 0 && (
          <RetroButton type="button" variant="secondary" className="w-full" onClick={handleFinishLane}>
            Ferdig med denne banen
          </RetroButton>
        )}

        {isLaneComplete && editingRoundNumber === null && (
          <RetroPanel className="bg-sage/30 text-sm">
            <p>Banen er ferdigspilt.</p>
            {isNoteTaker && (
              <RetroButton type="button" variant="secondary" className="mt-2 w-full" onClick={handleAddRound}>
                Legg til en runde til
              </RetroButton>
            )}
          </RetroPanel>
        )}

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Runder</p>
          <RoundList
            rounds={rounds}
            playerIds={table.data.playerIds}
            playerNames={playerNames}
            canEdit={isNoteTaker}
            onEdit={setEditingRoundNumber}
          />
        </RetroPanel>
      </div>
      {dialog}
    </div>
  );
}
