import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '../components/layout/BackLink';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { rememberTournament } from '../data/localHistory';
import { createTournament } from '../data/tournamentsRepo';
import { useAuth } from '../hooks/useAuth';
import { usePlayers } from '../hooks/usePlayers';

const MIN_PLAYERS = 3;

function PlayerPill({
  label,
  active,
  width,
  onClick,
}: {
  label: string;
  active: boolean;
  width: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width }}
      className={`overflow-hidden text-ellipsis whitespace-nowrap border-2 border-ink px-2 py-1.5 text-center text-sm font-semibold shadow-chunky-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
        active ? 'bg-sage text-ink' : 'bg-white text-ink/40'
      }`}
    >
      {active ? '✓ ' : ''}
      {label}
    </button>
  );
}

export function NewTournamentPage() {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const players = usePlayers();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Default to everyone selected — the organizer deselects who's not playing.
  useEffect(() => {
    if (!initialized.current && players.length > 0) {
      setSelected(new Set(players.map((p) => p.id)));
      initialized.current = true;
    }
  }, [players]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canSubmit = name.trim().length > 0 && selected.size >= MIN_PLAYERS && !!uid && !creating;
  // Uniform pill width capped to the longest name, so the grid lines up neatly
  // instead of every pill hugging its own (very uneven) text length.
  const longestNameLength = players.reduce((max, p) => Math.max(max, p.data.name.length), 0);
  const pillWidth = longestNameLength > 0 ? `${longestNameLength + 3}ch` : 'auto';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setCreating(true);
    setError(null);
    try {
      const playerNames = Object.fromEntries(
        players.filter((p) => selected.has(p.id)).map((p) => [p.id, p.data.name]),
      );
      const { id, joinCode } = await createTournament(name.trim(), uid, playerNames);
      rememberTournament({ id, name: name.trim(), joinCode });
      navigate(`/t/${id}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <BackLink to="/" label="Hjem" />
      <ScreenHeader title="Ny turnering" />
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
            placeholder="F.eks. Sommerbridge 2026"
          />
        </RetroPanel>

        <RetroPanel>
          <p className="mb-2 text-sm font-semibold">Velg spillere ({selected.size} valgt)</p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <PlayerPill
                key={p.id}
                label={p.data.name}
                active={selected.has(p.id)}
                width={pillWidth}
                onClick={() => toggle(p.id)}
              />
            ))}
          </div>
          {players.length === 0 && (
            <p className="text-sm text-ink/60">Ingen spillere i navnebanken ennå — legg til under «Spillere».</p>
          )}
        </RetroPanel>

        {error && <p className="text-sm text-negative">{error}</p>}
        <RetroButton type="submit" className="w-full" disabled={!canSubmit}>
          Opprett turnering
        </RetroButton>
      </form>
    </div>
  );
}
