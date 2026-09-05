import { Link } from 'react-router-dom';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { getRecentTournaments } from '../data/localHistory';

export function HistoryListPage() {
  const recent = getRecentTournaments();

  return (
    <div>
      <ScreenHeader title="Historikk" subtitle="Turneringer denne enheten har besøkt" />
      <div className="space-y-2 p-4">
        {recent.length === 0 && (
          <p className="text-sm text-ink/60">
            Ingen turneringer besøkt fra denne enheten ennå. Bli med i en turnering med en delt kode fra hjemskjermen.
          </p>
        )}
        {recent.map((t) => (
          <Link key={t.id} to={`/t/${t.id}`}>
            <RetroPanel className="hover:bg-sage/20">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-ink/60">Kode: {t.joinCode}</p>
            </RetroPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
