import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TrashIcon } from '../components/layout/TrashIcon';
import { forgetTournament, getRecentTournaments } from '../data/localHistory';
import { deleteTournament } from '../data/tournamentsRepo';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useIsAdmin } from '../hooks/useIsAdmin';

export function HistoryListPage() {
  const isAdmin = useIsAdmin();
  const [recent, setRecent] = useState(getRecentTournaments);
  const { confirm, dialog } = useConfirmDialog();

  async function handleDelete(e: MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirm({
      title: 'Slette turneringen?',
      message: `Dette sletter «${name}» og all historikk permanent. Dette kan ikke angres.`,
      confirmLabel: 'Slett for godt',
      danger: true,
    });
    if (!ok) return;
    await deleteTournament(id);
    forgetTournament(id);
    setRecent(getRecentTournaments());
  }

  return (
    <div>
      <ScreenHeader title="Historikk" subtitle="Turneringer denne enheten har besøkt" />
      <div className="space-y-4 p-4">
        <div>
          <h2 className="mb-2 font-pixel text-xs">Nylige turneringer</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink/60">Ingen turneringer besøkt fra denne enheten ennå.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link to={`/t/${t.id}`}>
                    <RetroPanel className="flex items-center justify-between gap-2 hover:bg-sage/20">
                      <div>
                        <p className="font-semibold">
                          {t.game === 'bowling' ? '🎳' : '🃏'} {t.name}
                        </p>
                        <p className="text-xs text-ink/60">Kode: {t.joinCode}</p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          className="shrink-0 p-1 text-negative"
                          aria-label={`Slett ${t.name}`}
                          onClick={(e) => handleDelete(e, t.id, t.name)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </RetroPanel>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {dialog}
    </div>
  );
}
