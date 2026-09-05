import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { getRecentTournaments, rememberTournament } from '../data/localHistory';
import { findTournamentByJoinCode } from '../data/tournamentsRepo';

export function HistoryListPage() {
  const navigate = useNavigate();
  const recent = getRecentTournaments();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);
    try {
      const tournament = await findTournamentByJoinCode(joinCode.trim());
      if (!tournament) {
        setJoinError('Fant ingen turnering med den koden.');
        return;
      }
      rememberTournament({
        id: tournament.id,
        name: tournament.data.name,
        joinCode: tournament.data.joinCode,
        game: tournament.data.game,
      });
      navigate(`/t/${tournament.id}`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div>
      <ScreenHeader title="Historikk" subtitle="Turneringer denne enheten har besøkt" />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <form onSubmit={handleJoin} className="space-y-2">
            <label className="block text-sm font-semibold" htmlFor="joinCode">
              Bli med med kode
            </label>
            <div className="flex gap-2">
              <input
                id="joinCode"
                className="min-w-0 flex-1 border-2 border-ink bg-white px-2 py-2 uppercase tracking-widest"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABCD12"
              />
              <RetroButton type="submit" className="shrink-0 whitespace-nowrap" disabled={joinCode.length !== 6 || joining}>
                Bli med
              </RetroButton>
            </div>
            {joinError && <p className="text-sm text-negative">{joinError}</p>}
          </form>
        </RetroPanel>

        <div>
          <h2 className="mb-2 font-pixel text-xs">Nylige turneringer</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink/60">Ingen turneringer besøkt fra denne enheten ennå.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link to={`/t/${t.id}`}>
                    <RetroPanel className="hover:bg-sage/20">
                      <p className="font-semibold">
                        {t.game === 'bowling' ? '🎳' : '🃏'} {t.name}
                      </p>
                      <p className="text-xs text-ink/60">Kode: {t.joinCode}</p>
                    </RetroPanel>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
