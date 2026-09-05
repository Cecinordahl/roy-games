import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import familyCardTable from '../assets/family-card-table.jpg';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { getRecentTournaments, rememberTournament } from '../data/localHistory';
import { findTournamentByJoinCode } from '../data/tournamentsRepo';
import { useAuth } from '../hooks/useAuth';

const PRIVACY_BANNER_KEY = 'roy-games:privacy-banner-dismissed';

function readBannerDismissed(): boolean {
  try {
    return localStorage.getItem(PRIVACY_BANNER_KEY) === 'true';
  } catch {
    return true;
  }
}

export function HomePage() {
  useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(readBannerDismissed);

  const recent = getRecentTournaments();

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

  function dismissBanner() {
    setBannerDismissed(true);
    try {
      localStorage.setItem(PRIVACY_BANNER_KEY, 'true');
    } catch {
      // localStorage unavailable — banner just reappears next visit, harmless.
    }
  }

  return (
    <div>
      <ScreenHeader title="Roy Games" subtitle="Scorekeeping for Bondebridge-turneringer" />
      <img
        src={familyCardTable}
        alt="Pikselillustrasjon av en familie som spiller kort rundt et bord"
        className="w-full border-b-2 border-ink bg-cream"
      />
      <div className="space-y-4 p-4">
        {!bannerDismissed && (
          <RetroPanel className="bg-yellow text-sm">
            <p>
              Roy Games lagrer navn og resultater for familieturneringer, permanent. Se{' '}
              <a href="/personvern" className="underline">
                personvernerklæringen
              </a>{' '}
              for detaljer.
            </p>
            <button type="button" className="mt-2 text-xs underline" onClick={dismissBanner}>
              Skjul
            </button>
          </RetroPanel>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Ny turnering</p>
          <div className="grid grid-cols-2 gap-2">
            <RetroButton onClick={() => navigate('/tournaments/new/bondebridge')}>🃏 Bondis</RetroButton>
            <RetroButton onClick={() => navigate('/tournaments/new/bowling')}>🎳 Bowling</RetroButton>
          </div>
        </div>

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

        {recent.length > 0 && (
          <div>
            <h2 className="mb-2 font-pixel text-xs">Nylige turneringer</h2>
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <RetroPanel
                    className="cursor-pointer hover:bg-sage/20"
                    onClick={() => navigate(`/t/${t.id}`)}
                  >
                    <p className="font-semibold">
                      {t.game === 'bowling' ? '🎳' : '🃏'} {t.name}
                    </p>
                    <p className="text-xs text-ink/60">Kode: {t.joinCode}</p>
                  </RetroPanel>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
