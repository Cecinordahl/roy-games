import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton, retroButtonClasses } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { RetroSelect } from '../components/layout/RetroSelect';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { GroupsEditor } from '../components/setup/GroupsEditor';
import { maxCards, buildRoundSequence } from '../domain/bondebridge/rounds';
import {
  distributeGroups,
  pickNoteTaker,
  shuffle,
  sizeWarning,
  splitIntoGroups,
  suggestGroupPlan,
} from '../domain/groupDistribution';
import type { RoundSequenceMode, SyncMode, TieBreakRule } from '../domain/types';
import { createStage } from '../data/stagesRepo';
import { createTable } from '../data/tablesRepo';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import { useAuth } from '../hooks/useAuth';
import { usePlayers } from '../hooks/usePlayers';
import { useTournament } from '../hooks/useTournament';

const ROUND_SEQUENCE_LABELS: Record<RoundSequenceMode, string> = {
  DESC: 'Synkende (mest vanlig)',
  ASC: 'Stigende',
  DESC_ASC: 'Synkende, så stigende',
  ASC_DESC: 'Stigende, så synkende',
};

export function StageSetupPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const players = usePlayers();

  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [roundSequence, setRoundSequence] = useState<RoundSequenceMode>('DESC');
  const [syncMode, setSyncMode] = useState<SyncMode>('SYNCED');
  const [tieBreakRule, setTieBreakRule] = useState<TieBreakRule>('FEWEST_PENALTY');
  const [groups, setGroups] = useState<string[][]>([]);
  const [noteTakers, setNoteTakers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceShowForm, setForceShowForm] = useState(false);

  const playerIds = tournament?.data.playerIds ?? [];
  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));
  const playerNames = tournament?.data.playerNames ?? {};

  useEffect(() => {
    if (tournament && groupCount === null) {
      const plan = suggestGroupPlan(playerIds.length);
      setGroupCount(plan.groupCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament]);

  useEffect(() => {
    if (groupCount !== null && tournament) {
      reshuffle(groupCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupCount, tournament]);

  function reshuffle(count: number) {
    if (!tournament) return;
    const sizes = distributeGroups(playerIds.length, count);
    const shuffled = shuffle(playerIds);
    const newGroups = splitIntoGroups(shuffled, sizes);
    setGroups(newGroups);
    setNoteTakers(newGroups.map((g) => pickNoteTaker(g, eligibleIds)));
  }

  function movePlayer(playerId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setGroups((prev) => {
      const next = prev.map((g) => [...g]);
      next[fromIndex] = next[fromIndex].filter((id) => id !== playerId);
      next[toIndex] = [...next[toIndex], playerId];
      return next;
    });
  }

  // Keeps each group's note taker valid after a manual move — only re-picks when
  // the previously assigned note taker no longer sits in that group.
  useEffect(() => {
    setNoteTakers((prev) => groups.map((g, i) => (g.includes(prev[i]) ? prev[i] : pickNoteTaker(g, eligibleIds))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null) return <p className="p-4">Fant ikke turneringen.</p>;
  if (uid && tournament.data.organizerUid !== uid) {
    return (
      <div>
        <ScreenHeader title="Konfigurasjon" />
        <p className="p-4 text-sm">
          Bare den som opprettet turneringen kan sette opp gruppespillet. Gå til{' '}
          <a className="underline" href={`/t/${tournamentId}`}>
            turneringen
          </a>{' '}
          for å se status.
        </p>
      </div>
    );
  }

  // Guards against the browser back button landing here after the group stage was
  // already created (e.g. "Start gruppespill" → back → "Start gruppespill" again),
  // which would otherwise silently create a second, duplicate stage.
  if (tournament.data.status !== 'setup' && !forceShowForm) {
    return (
      <div>
        <BackLink to="/" label="Hjem" />
        <ScreenHeader title="Gruppespillet er allerede satt opp" subtitle={tournament.data.name} />
        <div className="space-y-4 p-4">
          <RetroPanel className="bg-yellow">
            <p className="text-sm">
              Denne turneringen er allerede i gang. Vanligvis vil du ikke opprette et nytt gruppespill oppå det som
              finnes fra før.
            </p>
          </RetroPanel>
          <Link to={`/t/${tournamentId}`} className={retroButtonClasses('primary', 'block w-full')}>
            Gå til turneringen
          </Link>
          <RetroButton type="button" variant="secondary" className="w-full" onClick={() => setForceShowForm(true)}>
            Opprett et nytt gruppespill likevel
          </RetroButton>
        </div>
      </div>
    );
  }

  const sizes = groupCount !== null ? distributeGroups(playerIds.length, groupCount) : [];
  const warnings = sizes.map(sizeWarning).filter((w): w is string => !!w);

  async function handleStart() {
    if (!tournamentId || !uid || groupCount === null) return;
    setSaving(true);
    setError(null);
    try {
      const groupMaxCards = groups.map((g) => maxCards(g.length));
      const effectiveMax = syncMode === 'SYNCED' ? Math.min(...groupMaxCards) : null;

      const stageId = await createStage(tournamentId, {
        index: 0,
        name: 'Gruppespill',
        roundSequence,
        syncMode,
        tieBreakRule,
        status: 'active',
      });

      for (let i = 0; i < groups.length; i++) {
        const max = effectiveMax ?? groupMaxCards[i];
        const cardsPerRound = buildRoundSequence(max, roundSequence);
        await createTable(tournamentId, stageId, {
          name: `Gruppe ${i + 1}`,
          playerIds: groups[i],
          noteTakerPlayerId: noteTakers[i],
          noteTakerUid: uid,
          cardsPerRound,
          status: 'active',
        });
      }

      await updateTournamentStatus(tournamentId, 'active');
      navigate(`/t/${tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title="Sett opp gruppespill" subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="groupCount">
            Antall grupper
          </label>
          <input
            id="groupCount"
            type="number"
            min={1}
            max={playerIds.length}
            className="mt-1 w-24 border-2 border-ink bg-white px-2 py-1"
            value={groupCount ?? ''}
            onChange={(e) => setGroupCount(Math.max(1, Number(e.target.value) || 1))}
          />
          <p className="mt-1 text-xs text-ink/60">{playerIds.length} spillere totalt. Foretrukket gruppestørrelse er 4–6.</p>
          {warnings.length > 0 && <p className="mt-1 text-xs text-negative">{warnings.join(' ')}</p>}
        </RetroPanel>

        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="roundSequence">
            Rundetype
          </label>
          <RetroSelect
            id="roundSequence"
            className="mt-1"
            value={roundSequence}
            onChange={(e) => setRoundSequence(e.target.value as RoundSequenceMode)}
          >
            {Object.entries(ROUND_SEQUENCE_LABELS).map(([mode, label]) => (
              <option key={mode} value={mode}>
                {label}
              </option>
            ))}
          </RetroSelect>

          <div className="mt-3 border-t-2 border-ink/20 pt-3 text-xs text-ink/70">
            <p className="mb-1 font-semibold text-ink/80">Hva betyr dette? Rundetype styrer hvor mange kort hver spiller får per runde:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>Synkende</strong> — første runde deler ut flest kort (f.eks. 10), og hver runde etter har ett
                kort færre, ned til 1. Mest brukt.
              </li>
              <li>
                <strong>Stigende</strong> — motsatt: starter på 1 kort og øker opp til maks.
              </li>
              <li>
                <strong>Synkende, så stigende</strong> — teller ned til 1 og opp igjen til maks. Dobbelt så mange
                runder.
              </li>
              <li>
                <strong>Stigende, så synkende</strong> — teller opp til maks og ned igjen til 1. Dobbelt så mange
                runder.
              </li>
            </ul>
          </div>
        </RetroPanel>

        <RetroPanel>
          <p className="text-sm font-semibold">Rundeantall på tvers av grupper</p>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="radio" checked={syncMode === 'SYNCED'} onChange={() => setSyncMode('SYNCED')} />
            Synkronisert — alle grupper spiller like mange runder (rettferdig for rangering)
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="radio" checked={syncMode === 'INDEPENDENT'} onChange={() => setSyncMode('INDEPENDENT')} />
            Uavhengig — hver gruppe spiller så mange runder som bordstørrelsen gir
          </label>
        </RetroPanel>

        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="tieBreak">
            Regel ved poenglikhet
          </label>
          <RetroSelect
            id="tieBreak"
            className="mt-1"
            value={tieBreakRule}
            onChange={(e) => setTieBreakRule(e.target.value as TieBreakRule)}
          >
            <option value="FEWEST_PENALTY">Færrest strafferunder</option>
            <option value="HIGHEST_SUCCESSFUL_BID">Høyest vellykket melding</option>
            <option value="BOTH_ADVANCE">Begge går videre</option>
          </RetroSelect>
        </RetroPanel>

        <GroupsEditor
          groups={groups}
          noteTakers={noteTakers}
          playerNames={playerNames}
          eligibleIds={eligibleIds}
          groupLabel="Gruppe"
          onReshuffle={() => groupCount !== null && reshuffle(groupCount)}
          onMovePlayer={movePlayer}
          onNoteTakerChange={(index, playerId) =>
            setNoteTakers((prev) => prev.map((v, idx) => (idx === index ? playerId : v)))
          }
        />

        {error && <p className="text-sm text-negative">{error}</p>}
        <RetroButton type="button" className="w-full" onClick={handleStart} disabled={saving || groups.length === 0}>
          Start gruppespill
        </RetroButton>
      </div>
    </div>
  );
}
