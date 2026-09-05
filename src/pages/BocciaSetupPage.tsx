import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { RetroSelect } from '../components/layout/RetroSelect';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TrashIcon } from '../components/layout/TrashIcon';
import { rememberTournament } from '../data/localHistory';
import { createStage } from '../data/stagesRepo';
import { createTable } from '../data/tablesRepo';
import { createTournament, updateTournamentStatus } from '../data/tournamentsRepo';
import { pickNoteTaker } from '../domain/groupDistribution';
import type { BocciaParticipantMode } from '../domain/types';
import { useAuth } from '../hooks/useAuth';
import { usePlayers } from '../hooks/usePlayers';

const MAX_PARTICIPANTS = 4;
const MAX_TEAM_SIZE = 2;
const DEFAULT_TARGET_SCORE = 12;

interface TeamDraft {
  id: string;
  name: string;
  /** False until the organizer manually edits the name — until then it tracks the members automatically. */
  nameEdited: boolean;
  memberIds: string[];
}

function makeTeamId(): string {
  return `team-${Math.random().toString(36).slice(2, 10)}`;
}

function PlayerPill({ label, active, disabled, onClick }: { label: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`border-2 border-ink px-3 py-1.5 text-sm font-semibold shadow-chunky-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-sage text-ink' : 'bg-white text-ink/40'
      }`}
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  );
}

export function BocciaSetupPage() {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const players = usePlayers();

  function deriveTeamName(memberIds: string[], fallbackIndex: number): string {
    const memberNames = memberIds
      .map((id) => players.find((p) => p.id === id)?.data.name)
      .filter((n): n is string => !!n);
    return memberNames.length > 0 ? memberNames.join(' og ') : `Lag ${fallbackIndex + 1}`;
  }

  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [mode, setMode] = useState<BocciaParticipantMode>('players');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamDraft[]>([]);
  const [targetScore, setTargetScore] = useState(DEFAULT_TARGET_SCORE);
  const [noteTakerId, setNoteTakerId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibleIds = new Set(players.filter((p) => p.data.canBeNoteTaker).map((p) => p.id));
  const notePool = mode === 'players' ? selectedPlayerIds : teams.flatMap((t) => t.memberIds);
  const notePoolKey = notePool.join(',');

  useEffect(() => {
    if (notePool.length === 0) {
      setNoteTakerId('');
      return;
    }
    setNoteTakerId((prev) => (notePool.includes(prev) ? prev : pickNoteTaker(notePool, eligibleIds)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notePoolKey]);

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_PARTICIPANTS) return prev;
      return [...prev, id];
    });
  }

  function addTeam() {
    setTeams((prev) =>
      prev.length >= MAX_PARTICIPANTS
        ? prev
        : [...prev, { id: makeTeamId(), name: deriveTeamName([], prev.length), nameEdited: false, memberIds: [] }],
    );
  }

  function removeTeam(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  function renameTeam(id: string, teamName: string) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, name: teamName, nameEdited: true } : t)));
  }

  function toggleTeamMember(teamId: string, playerId: string) {
    setTeams((prev) =>
      prev.map((t, index) => {
        if (t.id === teamId) {
          const has = t.memberIds.includes(playerId);
          if (!has && t.memberIds.length >= MAX_TEAM_SIZE) return t;
          const memberIds = has ? t.memberIds.filter((id) => id !== playerId) : [...t.memberIds, playerId];
          return { ...t, memberIds, name: t.nameEdited ? t.name : deriveTeamName(memberIds, index) };
        }
        // A player can only be on one team — assigning them here unassigns them elsewhere.
        if (!t.memberIds.includes(playerId)) return t;
        const memberIds = t.memberIds.filter((id) => id !== playerId);
        return { ...t, memberIds, name: t.nameEdited ? t.name : deriveTeamName(memberIds, index) };
      }),
    );
  }

  const playersValid = mode === 'players' && selectedPlayerIds.length >= 2 && selectedPlayerIds.length <= MAX_PARTICIPANTS;
  const teamsValid =
    mode === 'teams' &&
    teams.length >= 2 &&
    teams.length <= MAX_PARTICIPANTS &&
    teams.every((t) => t.name.trim().length > 0 && t.memberIds.length >= 1);
  const canSubmit = name.trim().length > 0 && (playersValid || teamsValid) && !!noteTakerId && targetScore >= 1 && !!uid && !creating;

  const blockers: string[] = [];
  if (name.trim().length === 0) blockers.push('Skriv inn et turneringsnavn.');
  if (mode === 'players' && selectedPlayerIds.length < 2) {
    blockers.push(`Velg minst 2 spillere (${selectedPlayerIds.length} valgt).`);
  }
  if (mode === 'teams') {
    if (teams.length < 2) blockers.push(`Legg til minst 2 lag (${teams.length} lagt til).`);
    const emptyTeam = teams.find((t) => t.memberIds.length === 0);
    if (emptyTeam) blockers.push(`«${emptyTeam.name}» trenger minst én spiller.`);
    const unnamedTeam = teams.find((t) => t.name.trim().length === 0);
    if (unnamedTeam) blockers.push('Alle lag trenger et navn.');
  }
  if (!noteTakerId) blockers.push('Velg minst én spiller eller ett lag først, så velges notatfører automatisk.');
  if (!uid) blockers.push('Kobler til … vent litt.');

  const eligibleInNotePool = notePool.filter((id) => eligibleIds.has(id));
  const noteTakerOptions = eligibleInNotePool.length > 0 ? eligibleInNotePool : notePool;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid || !canSubmit) return;
    setCreating(true);
    setError(null);
    try {
      let participantIds: string[];
      let participantNames: Record<string, string>;
      let teamRosters: Record<string, string[]> | undefined;

      if (mode === 'players') {
        participantIds = selectedPlayerIds;
        participantNames = Object.fromEntries(
          players.filter((p) => selectedPlayerIds.includes(p.id)).map((p) => [p.id, p.data.name]),
        );
      } else {
        participantIds = teams.map((t) => t.id);
        participantNames = Object.fromEntries(teams.map((t) => [t.id, t.name.trim()]));
        teamRosters = Object.fromEntries(teams.map((t) => [t.id, t.memberIds]));
      }

      const extra: { teamRosters?: Record<string, string[]>; eventDate?: string } = {};
      if (teamRosters) extra.teamRosters = teamRosters;
      if (eventDate) extra.eventDate = eventDate;

      const { id, joinCode } = await createTournament(
        name.trim(),
        'boccia',
        uid,
        participantNames,
        Object.keys(extra).length > 0 ? extra : undefined,
      );

      const stageId = await createStage(id, {
        index: 0,
        name: 'Boccia',
        status: 'active',
      });
      await createTable(id, stageId, {
        name: 'Bane',
        playerIds: participantIds,
        noteTakerPlayerId: noteTakerId,
        noteTakerUid: uid,
        targetScore,
        status: 'active',
      });
      await updateTournamentStatus(id, 'active');
      rememberTournament({ id, name: name.trim(), joinCode, game: 'boccia', eventDate: eventDate || undefined });
      navigate(`/t/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title="Ny Boccia-turnering" />
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="tournamentName">
            Turneringsnavn
          </label>
          <input
            id="tournamentName"
            className="mt-1 w-full border-2 border-ink bg-white px-2 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Hagefest 2026"
          />
        </RetroPanel>

        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="eventDate">
            Dato (valgfritt)
          </label>
          <input
            id="eventDate"
            type="date"
            className="mt-1 border-2 border-ink bg-white px-2 py-2"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </RetroPanel>

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Spillere eller lag?</p>
          <div className="grid grid-cols-2 gap-2">
            <RetroButton type="button" variant={mode === 'players' ? 'primary' : 'secondary'} onClick={() => setMode('players')}>
              Spillere
            </RetroButton>
            <RetroButton type="button" variant={mode === 'teams' ? 'primary' : 'secondary'} onClick={() => setMode('teams')}>
              Lag
            </RetroButton>
          </div>
          <p className="mt-2 text-xs text-ink/60">Opptil {MAX_PARTICIPANTS} spillere eller lag kan delta.</p>
        </RetroPanel>

        {mode === 'players' ? (
          <RetroPanel>
            <p className="mb-2 text-sm font-semibold">Velg spillere ({selectedPlayerIds.length}/{MAX_PARTICIPANTS})</p>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <PlayerPill
                  key={p.id}
                  label={p.data.name}
                  active={selectedPlayerIds.includes(p.id)}
                  disabled={!selectedPlayerIds.includes(p.id) && selectedPlayerIds.length >= MAX_PARTICIPANTS}
                  onClick={() => togglePlayer(p.id)}
                />
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-sm text-ink/60">Ingen spillere i navnebanken ennå — legg til under «Spillere».</p>
            )}
          </RetroPanel>
        ) : (
          <RetroPanel>
            <p className="text-sm font-semibold">
              Lag ({teams.length}/{MAX_PARTICIPANTS})
            </p>
            <p className="mb-2 text-xs text-ink/60">Maks {MAX_TEAM_SIZE} spillere per lag.</p>
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.id} className="border-2 border-ink/30 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="min-w-0 flex-1 border-2 border-ink bg-white px-2 py-1 text-sm"
                      value={team.name}
                      onChange={(e) => renameTeam(team.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="shrink-0 p-1 text-negative"
                      aria-label={`Fjern ${team.name}`}
                      onClick={() => removeTeam(team.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {players.map((p) => {
                      const onThisTeam = team.memberIds.includes(p.id);
                      const onOtherTeam = teams.some((t) => t.id !== team.id && t.memberIds.includes(p.id));
                      const teamFull = team.memberIds.length >= MAX_TEAM_SIZE;
                      return (
                        <PlayerPill
                          key={p.id}
                          label={p.data.name}
                          active={onThisTeam}
                          disabled={onOtherTeam || (!onThisTeam && teamFull)}
                          onClick={() => toggleTeamMember(team.id, p.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-sm text-ink/60">Legg til minst to lag.</p>}
            </div>
            <RetroButton
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={addTeam}
              disabled={teams.length >= MAX_PARTICIPANTS}
            >
              + Legg til lag
            </RetroButton>
          </RetroPanel>
        )}

        <RetroPanel>
          <label className="block text-sm font-semibold" htmlFor="targetScore">
            Først til hvor mange poeng?
          </label>
          <input
            id="targetScore"
            type="number"
            min={1}
            className="mt-1 w-24 border-2 border-ink bg-white px-2 py-1"
            value={targetScore}
            onChange={(e) => setTargetScore(Math.max(1, Number(e.target.value) || 1))}
          />
          <p className="mt-1 text-xs text-ink/60">
            Spillet slutter så snart noen når dette antallet poeng.
          </p>
        </RetroPanel>

        {notePool.length > 0 && (
          <RetroPanel>
            <label className="block text-sm font-semibold" htmlFor="noteTaker">
              Notatfører
            </label>
            <RetroSelect id="noteTaker" className="mt-1" value={noteTakerId} onChange={(e) => setNoteTakerId(e.target.value)}>
              {noteTakerOptions.map((id) => (
                <option key={id} value={id}>
                  {players.find((p) => p.id === id)?.data.name ?? id}
                </option>
              ))}
            </RetroSelect>
          </RetroPanel>
        )}

        {error && <p className="text-sm text-negative">{error}</p>}
        {!canSubmit && !creating && blockers.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-negative">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        <RetroButton type="submit" className="w-full" disabled={!canSubmit}>
          Start Boccia
        </RetroButton>
      </form>
    </div>
  );
}
