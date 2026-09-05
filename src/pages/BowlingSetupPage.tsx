import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton, retroButtonClasses } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { RetroSelect } from '../components/layout/RetroSelect';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { GroupsEditor } from '../components/setup/GroupsEditor';
import { createStage } from '../data/stagesRepo';
import { createTable } from '../data/tablesRepo';
import { updateTournamentStatus } from '../data/tournamentsRepo';
import {
  distributeGroups,
  pickNoteTaker,
  shuffle,
  sizeWarning,
  splitIntoGroups,
  suggestGroupPlan,
} from '../domain/groupDistribution';
import type { ReshuffleMode } from '../domain/types';
import { useAuth } from '../hooks/useAuth';
import { usePlayers } from '../hooks/usePlayers';
import { useTournament } from '../hooks/useTournament';

export function BowlingSetupPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { uid } = useAuth();
  const tournament = useTournament(tournamentId);
  const players = usePlayers();

  const [laneCount, setLaneCount] = useState<number | null>(null);
  const [reshuffleMode, setReshuffleMode] = useState<ReshuffleMode>('RESEED_EACH_ROUND');
  const [lanes, setLanes] = useState<string[][]>([]);
  const [noteTakers, setNoteTakers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceShowForm, setForceShowForm] = useState(false);

  const playerIds = tournament?.data.playerIds ?? [];
  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));
  const playerNames = tournament?.data.playerNames ?? {};

  useEffect(() => {
    if (tournament && laneCount === null) {
      const plan = suggestGroupPlan(playerIds.length);
      setLaneCount(plan.groupCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament]);

  useEffect(() => {
    if (laneCount !== null && tournament) {
      reshuffle(laneCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laneCount, tournament]);

  function reshuffle(count: number) {
    if (!tournament) return;
    const sizes = distributeGroups(playerIds.length, count);
    const shuffled = shuffle(playerIds);
    const newLanes = splitIntoGroups(shuffled, sizes);
    setLanes(newLanes);
    setNoteTakers(newLanes.map((lane) => pickNoteTaker(lane, eligibleIds)));
  }

  function movePlayer(playerId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setLanes((prev) => {
      const next = prev.map((lane) => [...lane]);
      next[fromIndex] = next[fromIndex].filter((id) => id !== playerId);
      next[toIndex] = [...next[toIndex], playerId];
      return next;
    });
  }

  // Keeps each lane's note taker valid after a manual move — only re-picks when
  // the previously assigned note taker no longer sits on that lane.
  useEffect(() => {
    setNoteTakers((prev) => lanes.map((lane, i) => (lane.includes(prev[i]) ? prev[i] : pickNoteTaker(lane, eligibleIds))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes]);

  if (tournament === undefined) return <p className="p-4">Laster …</p>;
  if (tournament === null) return <p className="p-4">Fant ikke turneringen.</p>;
  if (uid && tournament.data.organizerUid !== uid) {
    return (
      <div>
        <ScreenHeader title="Konfigurasjon" />
        <p className="p-4 text-sm">
          Bare den som opprettet turneringen kan sette opp bowlingen. Gå til{' '}
          <Link className="underline" to={`/t/${tournamentId}`}>
            turneringen
          </Link>{' '}
          for å se status.
        </p>
      </div>
    );
  }

  // Same back-button guard as Bondebridge's setup — see StageSetupPage for the full rationale.
  if (tournament.data.status !== 'setup' && !forceShowForm) {
    return (
      <div>
        <BackLink to="/" label="Hjem" />
        <ScreenHeader title="Bowlingen er allerede satt opp" subtitle={tournament.data.name} />
        <div className="space-y-4 p-4">
          <RetroPanel className="bg-yellow">
            <p className="text-sm">
              Denne turneringen er allerede i gang. Vanligvis vil du ikke sette opp banene på nytt.
            </p>
          </RetroPanel>
          <Link to={`/t/${tournamentId}`} className={retroButtonClasses('primary', 'block w-full')}>
            Gå til turneringen
          </Link>
          <RetroButton type="button" variant="secondary" className="w-full" onClick={() => setForceShowForm(true)}>
            Sett opp på nytt likevel
          </RetroButton>
        </div>
      </div>
    );
  }

  const sizes = laneCount !== null ? distributeGroups(playerIds.length, laneCount) : [];
  const warnings = sizes.map(sizeWarning).filter((w): w is string => !!w);

  async function handleStart() {
    if (!tournamentId || !uid || laneCount === null) return;
    setSaving(true);
    setError(null);
    try {
      const stageId = await createStage(tournamentId, {
        index: 0,
        name: 'Runde 1',
        status: 'active',
        reshuffleMode,
        // "Re-seed every round" is always exactly one round before reshuffling;
        // "group stage then final lane" has no preset — each lane finishes
        // manually via "Ferdig med denne banen" whenever the note taker is done.
        ...(reshuffleMode === 'RESEED_EACH_ROUND' ? { roundCount: 1 } : {}),
      });

      for (let i = 0; i < lanes.length; i++) {
        await createTable(tournamentId, stageId, {
          name: `Bane ${i + 1}`,
          playerIds: lanes[i],
          noteTakerPlayerId: noteTakers[i],
          noteTakerUid: uid,
          ...(reshuffleMode === 'RESEED_EACH_ROUND' ? { roundCount: 1 } : {}),
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
      <ScreenHeader title="Sett opp bowling" subtitle={tournament.data.name} />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="laneCount">
            Antall baner
          </label>
          <input
            id="laneCount"
            type="number"
            min={1}
            max={playerIds.length}
            className="mt-1 w-24 border-2 border-ink bg-white px-2 py-1"
            value={laneCount ?? ''}
            onChange={(e) => setLaneCount(Math.max(1, Number(e.target.value) || 1))}
          />
          <p className="mt-1 text-xs text-ink/60">{playerIds.length} spillere totalt. Foretrukket banestørrelse er 4–6.</p>
          {warnings.length > 0 && <p className="mt-1 text-xs text-negative">{warnings.join(' ')}</p>}
        </RetroPanel>

        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="reshuffleMode">
            Omstokking av baner
          </label>
          <RetroSelect
            id="reshuffleMode"
            className="mt-1"
            value={reshuffleMode}
            onChange={(e) => setReshuffleMode(e.target.value as ReshuffleMode)}
          >
            <option value="RESEED_EACH_ROUND">Re-seed hver runde</option>
            <option value="GROUP_THEN_FINAL">Gruppespill + finalebane</option>
          </RetroSelect>

          <div className="mt-3 border-t-2 border-ink/20 pt-3 text-xs text-ink/70">
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>Re-seed hver runde</strong> — etter hver runde rangeres alle spillerne på nytt basert på
                totalpoeng, og banene settes opp igjen slik at de beste spillerne havner sammen. Alle blir med videre,
                ingen ryker ut.
              </li>
              <li>
                <strong>Gruppespill + finalebane</strong> — banene er faste, men det er ikke noe fast antall runder.
                Hver notatfører spiller så mange runder de vil og trykker «Ferdig med denne banen» når de er ferdige.
                Når alle banene er ferdige, går de beste fra hver bane videre til én finalebane, akkurat som i Bondis.
              </li>
            </ul>
          </div>
        </RetroPanel>

        <GroupsEditor
          groups={lanes}
          noteTakers={noteTakers}
          playerNames={playerNames}
          eligibleIds={eligibleIds}
          groupLabel="Bane"
          onReshuffle={() => laneCount !== null && reshuffle(laneCount)}
          onMovePlayer={movePlayer}
          onNoteTakerChange={(index, playerId) =>
            setNoteTakers((prev) => prev.map((v, idx) => (idx === index ? playerId : v)))
          }
        />

        {error && <p className="text-sm text-negative">{error}</p>}
        <RetroButton type="button" className="w-full" onClick={handleStart} disabled={saving || lanes.length === 0}>
          Start bowling
        </RetroButton>
      </div>
    </div>
  );
}
