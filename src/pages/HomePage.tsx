import { Link } from 'react-router-dom';
import bondisHero from '../assets/bondis-hero.jpg';
import bowlingLane from '../assets/bowling-lane.jpg';
import { ScreenHeader } from '../components/layout/ScreenHeader';
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

  return (
    <div>
      <ScreenHeader title="Roy Games" subtitle="Velg spill" />
      <div className="space-y-4 p-4">
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
      </div>
      <p className="p-4 text-center">
        <a href="/personvern" className="text-xs text-ink/50 underline">
          Personvern
        </a>
      </p>
    </div>
  );
}
