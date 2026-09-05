import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bocciaHero from '../assets/boccia-hero.jpg';
import bondisHero from '../assets/bondis-hero.jpg';
import bowlingLane from '../assets/bowling-lane.jpg';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { rememberTournament } from '../data/localHistory';
import { findTournamentByJoinCode } from '../data/tournamentsRepo';
import { useAuth } from '../hooks/useAuth';

function GameTile({ to, image, alt, label }: { to: string; image: string; alt: string; label: string }) {
  return (
    <Link
      to={to}
      className="block border-2 border-ink bg-surface shadow-chunky transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      <img src={image} alt={alt} className="w-full border-b-2 border-ink bg-cream" />
      <p className="p-3 text-center font-pixel text-sm text-ink">{label}</p>
    </Link>
  );
}

export function HomePage() {
  useAuth();
  const navigate = useNavigate();
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
      <ScreenHeader title="Roy Games" subtitle="Velg spill" />
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

        <GameTile
          to="/tournaments/new/bondebridge"
          image={bondisHero}
          alt="Pikselillustrasjon av en familie som jubler sammen"
          label="🃏 Bondis"
        />
        <GameTile
          to="/tournaments/new/bowling"
          image={bowlingLane}
          alt="Pikselillustrasjon av en familie som bowler"
          label="🎳 Bowling"
        />
        <GameTile
          to="/tournaments/new-boccia"
          image={bocciaHero}
          alt="Pikselillustrasjon av barn som spiller boccia"
          label="🎯 Boccia"
        />
      </div>
      <p className="p-4 text-center">
        <Link to="/personvern" className="text-xs text-ink/50 underline">
          Personvern
        </Link>
      </p>
    </div>
  );
}
