import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { StandingsTable } from '../components/standings/StandingsTable';
import { RoundEntryForm } from '../components/round/RoundEntryForm';
import { RoundList } from '../components/round/RoundList';
import { saveRound } from '../data/roundsRepo';
import { takeOverNoteTaking, updateTable } from '../data/tablesRepo';
import { computeStandings } from '../domain/standings';
import { useAuth } from '../hooks/useAuth';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useRounds } from '../hooks/useRounds';
import { useTable } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

export function TablePage() {
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
    return <p className="p-4">Fant ikke bordet.</p>;
  }

  const playerNames = tournament.data.playerNames;
  const isNoteTaker = !!uid && uid === table.data.noteTakerUid;
  const totalRounds = table.data.cardsPerRound.length;
  const nextRoundNumber = rounds.length + 1;
  const isTableComplete = table.data.status === 'complete';

  const editingRound = editingRoundNumber !== null ? rounds.find((r) => r.data.roundNumber === editingRoundNumber) : undefined;
  const activeRoundNumber = editingRoundNumber ?? (isTableComplete ? null : nextRoundNumber);
  const activeCards = activeRoundNumber !== null ? table.data.cardsPerRound[activeRoundNumber - 1] : null;

  async function handleTakeOver() {
    if (!uid || !tournamentId || !stageId || !tableId) return;
    await takeOverNoteTaking(tournamentId, stageId, tableId, uid);
  }

  async function handleSaveRound(
    bids: Record<string, number>,
    tricks: Record<string, number>,
    scores: Record<string, number>,
  ) {
    if (!tournamentId || !stageId || !tableId || !table || activeRoundNumber === null || activeCards === null) return;

    if (isTableComplete && editingRoundNumber !== null) {
      const hypotheticalRounds = rounds.map((r) =>
        r.data.roundNumber === editingRoundNumber ? { ...r.data, bids, tricks, scores } : r.data,
      );
      const before = standings.map((s) => s.playerId);
      const after = computeStandings(hypotheticalRounds, table.data.playerIds).map((s) => s.playerId);
      const changesResult = before.some((id, i) => id !== after[i]);
      if (changesResult) {
        const ok = await confirm({
          title: 'Endrer sluttresultatet',
          message: 'Denne endringen påvirker sluttresultatet for bordet. Lagre likevel?',
          confirmLabel: 'Lagre likevel',
          danger: true,
        });
        if (!ok) return;
      }
    }

    await saveRound(tournamentId, stageId, tableId, activeRoundNumber, { cards: activeCards, bids, tricks, scores });

    if (!isTableComplete && activeRoundNumber === totalRounds) {
      await updateTable(tournamentId, stageId, tableId, { status: 'complete' });
    }
    setEditingRoundNumber(null);
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}`} label="Til turneringen" />
      <ScreenHeader title={table.data.name} subtitle={`${tournament.data.name} — runde ${Math.min(rounds.length + 1, totalRounds)} av ${totalRounds}`} />
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

        {isNoteTaker && activeRoundNumber !== null && activeCards !== null && (
          <RoundEntryForm
            key={activeRoundNumber}
            playerIds={table.data.playerIds}
            playerNames={playerNames}
            cards={activeCards}
            initialBids={editingRound?.data.bids}
            initialTricks={editingRound?.data.tricks}
            onSave={handleSaveRound}
            onCancel={editingRoundNumber !== null ? () => setEditingRoundNumber(null) : undefined}
          />
        )}

        {isTableComplete && editingRoundNumber === null && (
          <RetroPanel className="bg-sage/30 text-sm">Bordet er ferdigspilt.</RetroPanel>
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
