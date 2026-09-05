import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TieBreakPicker } from '../components/standings/TieBreakPicker';
import { createStage, updateStage } from '../data/stagesRepo';
import { createTable } from '../data/tablesRepo';
import type { TableDoc, WithId } from '../data/types';
import {
  planRemainingTables,
  proposeAdvancement,
  suggestAdvanceCount,
  validateAdvanceCount,
} from '../domain/advancement';
import { buildRoundSequence, maxCards } from '../domain/bondebridge/rounds';
import { pickNoteTaker, splitIntoGroups } from '../domain/groupDistribution';
import { computeStandings, findTieAtCutoff, resolveTie, type TieGroup } from '../domain/standings';
import type { TieBreakRule } from '../domain/types';
import { useAuth } from '../hooks/useAuth';
import { usePlayers } from '../hooks/usePlayers';
import { useRounds } from '../hooks/useRounds';
import { useStage } from '../hooks/useStages';
import { useTables } from '../hooks/useTables';
import { useTournament } from '../hooks/useTournament';

function spliceOrder(order: string[], tie: TieGroup, resolvedOrder: string[]): string[] {
  const firstIndex = order.findIndex((id) => tie.playerIds.includes(id));
  return [...order.slice(0, firstIndex), ...resolvedOrder, ...order.slice(firstIndex + tie.playerIds.length)];
}

interface TableOrderResult {
  order: string[];
  resolved: boolean;
  totalsByPlayer: Record<string, number>;
}

/**
 * One instance per table. Resolves that table's advancement order (auto tie-break,
 * falling back to a manual picker), and reports the result upward. Kept as its own
 * component (rather than a hook called in a loop) so the number of hooks used stays
 * fixed per component instance regardless of how many tables the stage has.
 */
function TableOrderResolver({
  tournamentId,
  stageId,
  table,
  advanceCount,
  tieBreakRule,
  manualOrder,
  playerNames,
  onResolveManual,
  onResult,
}: {
  tournamentId: string;
  stageId: string;
  table: WithId<TableDoc>;
  advanceCount: number;
  /** Undefined for games with no automatic tie-break rule (e.g. bowling) — always falls to manual. */
  tieBreakRule: TieBreakRule | undefined;
  manualOrder: string[] | undefined;
  playerNames: Record<string, string>;
  onResolveManual: (tableId: string, order: string[]) => void;
  onResult: (tableId: string, result: TableOrderResult) => void;
}) {
  const rounds = useRounds(tournamentId, stageId, table.id);
  const roundData = rounds.map((r) => r.data);
  const standings = computeStandings(roundData, table.data.playerIds);
  const totalsByPlayer = Object.fromEntries(standings.map((s) => [s.playerId, s.total]));
  const tie = findTieAtCutoff(standings, Math.min(advanceCount, table.data.playerIds.length));

  let order = standings.map((s) => s.playerId);
  let needsManualChoice: TieGroup | undefined;

  if (tie) {
    if (manualOrder) {
      order = spliceOrder(order, tie, manualOrder);
    } else if (tieBreakRule) {
      const resolution = resolveTie(tie, roundData, tieBreakRule);
      if (resolution.resolved) order = spliceOrder(order, tie, resolution.order);
      else needsManualChoice = tie;
    } else {
      // No automatic rule for this game (bowling) — always ask.
      needsManualChoice = tie;
    }
  }

  const resolved = !needsManualChoice;
  const orderKey = order.join(',');
  const totalsKey = JSON.stringify(totalsByPlayer);

  useEffect(() => {
    onResult(table.id, { order, resolved, totalsByPlayer });
    // Deps are the *serialized* values so this only fires when the computed result
    // actually changes, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.id, orderKey, resolved, totalsKey]);

  if (!needsManualChoice) return null;

  return (
    <RetroPanel>
      <p className="mb-1 text-sm font-semibold">{table.data.name}</p>
      <TieBreakPicker
        tiedPlayerIds={needsManualChoice.playerIds}
        playerNames={playerNames}
        onResolve={(resolvedOrder) => onResolveManual(table.id, resolvedOrder)}
      />
    </RetroPanel>
  );
}

export function AdvancementPage() {
  const { tournamentId, stageId } = useParams<{ tournamentId: string; stageId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const stage = useStage(tournamentId, stageId);
  const tables = useTables(tournamentId, stageId);
  const players = usePlayers();

  const groupSizes = tables.map((t) => t.data.playerIds.length);
  const [advanceCount, setAdvanceCount] = useState<number | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<Record<string, TableOrderResult>>({});
  const [continueRemaining, setContinueRemaining] = useState(true);
  const [saving, setSaving] = useState(false);

  const effectiveAdvanceCount = advanceCount ?? (groupSizes.length > 0 ? suggestAdvanceCount(groupSizes) : 1);
  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));

  function handleResult(tableId: string, result: TableOrderResult) {
    setResults((prev) => ({ ...prev, [tableId]: result }));
  }

  function handleResolveManual(tableId: string, order: string[]) {
    setManualOverrides((prev) => ({ ...prev, [tableId]: order }));
  }

  if (tournament === undefined || stage === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null || stage === null || !tournamentId || !stageId) {
    return <p className="p-4">Fant ikke runden.</p>;
  }

  const playerNames = tournament.data.playerNames;
  const validation = groupSizes.length > 0 ? validateAdvanceCount(groupSizes, effectiveAdvanceCount) : { valid: false };
  const allReady = tables.length > 0 && tables.every((t) => results[t.id]);
  const allResolved = allReady && tables.every((t) => results[t.id].resolved);

  const totalsByPlayer: Record<string, number> = {};
  tables.forEach((t) => Object.assign(totalsByPlayer, results[t.id]?.totalsByPlayer ?? {}));

  const groupOrders = tables.map((t) => results[t.id]?.order ?? []);
  const canPropose = validation.valid && allResolved;
  const { winnersPlayerIds, remainingPlayerIds } = canPropose
    ? proposeAdvancement(groupOrders, effectiveAdvanceCount)
    : { winnersPlayerIds: [] as string[], remainingPlayerIds: [] as string[] };

  const sortedWinners = [...winnersPlayerIds].sort((a, b) => (totalsByPlayer[b] ?? 0) - (totalsByPlayer[a] ?? 0));
  const sortedRemaining = [...remainingPlayerIds].sort((a, b) => (totalsByPlayer[b] ?? 0) - (totalsByPlayer[a] ?? 0));
  const remainingPlan = planRemainingTables(sortedRemaining.length);
  const remainingGroups = splitIntoGroups(sortedRemaining, remainingPlan.sizes);

  const isBowling = tournament.data.game === 'bowling';
  const winnerLabel = isBowling ? 'Vinnerbane' : 'Vinnerbord';
  const otherLabel = isBowling ? 'Bane' : 'Bord';

  async function handleConfirm() {
    if (!tournamentId || !stageId || !uid || !stage || !tournament || !canPropose) return;
    setSaving(true);
    try {
      await updateStage(tournamentId, stageId, { status: 'complete', advanceCount: effectiveAdvanceCount });

      const nextIndex = stage.data.index + 1;
      const willHaveMoreTables = continueRemaining && remainingGroups.length > 0;
      const newStageId = await createStage(tournamentId, {
        index: nextIndex,
        name: willHaveMoreTables ? `${winnerLabel} og videre spill` : winnerLabel,
        status: 'active',
        ...(isBowling
          ? { reshuffleMode: 'GROUP_THEN_FINAL' as const, ...(stage.data.roundCount !== undefined ? { roundCount: stage.data.roundCount } : {}) }
          : { roundSequence: stage.data.roundSequence, syncMode: stage.data.syncMode, tieBreakRule: stage.data.tieBreakRule }),
      });

      await createTable(tournamentId, newStageId, {
        name: winnerLabel,
        playerIds: sortedWinners,
        noteTakerPlayerId: pickNoteTaker(sortedWinners, eligibleIds),
        noteTakerUid: uid,
        status: 'active',
        ...(isBowling
          ? stage.data.roundCount !== undefined
            ? { roundCount: stage.data.roundCount }
            : {}
          : { cardsPerRound: buildRoundSequence(maxCards(sortedWinners.length), stage.data.roundSequence!) }),
      });

      if (willHaveMoreTables) {
        for (let i = 0; i < remainingGroups.length; i++) {
          const group = remainingGroups[i];
          await createTable(tournamentId, newStageId, {
            name: `${otherLabel} ${i + 2}`,
            playerIds: group,
            noteTakerPlayerId: pickNoteTaker(group, eligibleIds),
            noteTakerUid: uid,
            status: 'active',
            ...(isBowling
              ? stage.data.roundCount !== undefined
                ? { roundCount: stage.data.roundCount }
                : {}
              : { cardsPerRound: buildRoundSequence(maxCards(group.length), stage.data.roundSequence!) }),
          });
        }
      }

      navigate(`/t/${tournamentId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <BackLink to={`/t/${tournamentId}/stages/${stageId}/standings`} label="Til tabellen" />
      <ScreenHeader title="Foreslå neste runde" subtitle={stage.data.name} />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="advanceCount">
            Antall som går videre per {isBowling ? 'bane' : 'bord'}
          </label>
          <input
            id="advanceCount"
            type="number"
            min={1}
            className="mt-1 w-24 border-2 border-ink bg-white px-2 py-1"
            value={effectiveAdvanceCount}
            onChange={(e) => setAdvanceCount(Math.max(1, Number(e.target.value) || 1))}
          />
          {!validation.valid && (
            <p className="mt-1 text-xs text-negative">
              {'reason' in validation ? validation.reason : ''} Foreslått: {'suggestedAdvanceCount' in validation ? validation.suggestedAdvanceCount : ''}.
            </p>
          )}
        </RetroPanel>

        {tables.map((t) => (
          <TableOrderResolver
            key={t.id}
            tournamentId={tournamentId}
            stageId={stageId}
            table={t}
            advanceCount={effectiveAdvanceCount}
            tieBreakRule={stage.data.tieBreakRule}
            manualOrder={manualOverrides[t.id]}
            playerNames={playerNames}
            onResolveManual={handleResolveManual}
            onResult={handleResult}
          />
        ))}

        {canPropose && (
          <>
            <RetroPanel className="bg-sage/30">
              <p className="text-sm font-semibold">
                {winnerLabel} ({sortedWinners.length})
              </p>
              <p className="text-sm">{sortedWinners.map((id) => playerNames[id] ?? id).join(', ')}</p>
            </RetroPanel>

            {sortedRemaining.length > 0 && (
              <RetroPanel>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={continueRemaining}
                    onChange={(e) => setContinueRemaining(e.target.checked)}
                  />
                  Skal de resterende {sortedRemaining.length} spille videre?
                </label>
                {continueRemaining && (
                  <div className="mt-2 space-y-2">
                    {remainingGroups.map((group, i) => (
                      <p key={i} className="text-sm">
                        <strong>
                          {otherLabel} {i + 2}:
                        </strong>{' '}
                        {group.map((id) => playerNames[id] ?? id).join(', ')}
                      </p>
                    ))}
                  </div>
                )}
              </RetroPanel>
            )}

            <RetroButton type="button" className="w-full" onClick={handleConfirm} disabled={saving}>
              Bekreft og opprett neste runde
            </RetroButton>
          </>
        )}
      </div>
    </div>
  );
}
