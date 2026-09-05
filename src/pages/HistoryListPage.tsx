import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TrashIcon } from '../components/layout/TrashIcon';
import { forgetTournament, getRecentTournaments } from '../data/localHistory';
import { deleteTournament, listAllTournaments } from '../data/tournamentsRepo';
import { formatNorwegianDate } from '../domain/dates';
import type { GameType } from '../domain/types';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useIsAdmin } from '../hooks/useIsAdmin';

const GAME_ICONS: Record<GameType, string> = {
  bondebridge: '🃏',
  bowling: '🎳',
  boccia: '🎯',
};

interface TournamentRow {
  id: string;
  name: string;
  joinCode: string;
  game?: GameType;
  eventDate?: string;
}

function TournamentRowItem({
  tournament,
  showDelete,
  onDelete,
}: {
  tournament: TournamentRow;
  showDelete: boolean;
  onDelete: (e: MouseEvent, id: string, name: string) => void;
}) {
  return (
    <Link to={`/t/${tournament.id}`}>
      <RetroPanel className="flex items-center justify-between gap-2 hover:bg-sage/20">
        <div>
          <p className="font-semibold">
            {GAME_ICONS[tournament.game ?? 'bondebridge']} {tournament.name}
          </p>
          <p className="text-xs text-ink/60">
            Kode: {tournament.joinCode}
            {tournament.eventDate && <> · {formatNorwegianDate(tournament.eventDate)}</>}
          </p>
        </div>
        {showDelete && (
          <button
            type="button"
            className="shrink-0 p-1 text-negative"
            aria-label={`Slett ${tournament.name}`}
            onClick={(e) => onDelete(e, tournament.id, tournament.name)}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </RetroPanel>
    </Link>
  );
}

export function HistoryListPage() {
  const isAdmin = useIsAdmin();
  const [recent, setRecent] = useState(getRecentTournaments);
  const [allTournaments, setAllTournaments] = useState<TournamentRow[] | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    if (!isAdmin) {
      setAllTournaments(null);
      return;
    }
    listAllTournaments().then((tournaments) =>
      setAllTournaments(
        tournaments.map((t) => ({
          id: t.id,
          name: t.data.name,
          joinCode: t.data.joinCode,
          game: t.data.game,
          eventDate: t.data.eventDate,
        })),
      ),
    );
  }, [isAdmin]);

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
    setAllTournaments((prev) => prev?.filter((t) => t.id !== id) ?? null);
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
                  <TournamentRowItem tournament={t} showDelete={isAdmin} onDelete={handleDelete} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {isAdmin && (
          <div>
            <h2 className="mb-2 font-pixel text-xs">Alle turneringer (admin)</h2>
            {allTournaments === null ? (
              <p className="text-sm text-ink/60">Laster …</p>
            ) : allTournaments.length === 0 ? (
              <p className="text-sm text-ink/60">Ingen turneringer ennå.</p>
            ) : (
              <ul className="space-y-2">
                {allTournaments.map((t) => (
                  <li key={t.id}>
                    <TournamentRowItem tournament={t} showDelete onDelete={handleDelete} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}
