import { useEffect, useState, type FormEvent } from 'react';
import { RetroButton } from '../components/layout/RetroButton';
import { RetroCheckbox } from '../components/layout/RetroCheckbox';
import { RetroPanel } from '../components/layout/RetroPanel';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { TrashIcon } from '../components/layout/TrashIcon';
import { addPlayer, deletePlayer, seedDefaultPlayersIfEmpty, updatePlayer } from '../data/playersRepo';
import { usePlayers } from '../hooks/usePlayers';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

export function PlayerBankPage() {
  const players = usePlayers();
  const [name, setName] = useState('');
  const [canBeNoteTaker, setCanBeNoteTaker] = useState(true);
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    seedDefaultPlayersIfEmpty();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addPlayer({ name: name.trim(), canBeNoteTaker });
    setName('');
    setCanBeNoteTaker(true);
  }

  async function handleDelete(playerId: string, playerName: string) {
    const ok = await confirm({
      title: 'Slette spiller?',
      message: `Slette ${playerName} fra navnebanken? Dette påvirker ikke tidligere turneringer.`,
      confirmLabel: 'Slett',
      danger: true,
    });
    if (ok) await deletePlayer(playerId);
  }

  return (
    <div>
      <ScreenHeader title="Spillere" subtitle="Navnebank for turneringer" />
      <div className="space-y-4 p-4">
        <RetroPanel>
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="newPlayerName">
              Legg til spiller
            </label>
            <input
              id="newPlayerName"
              className="border-2 border-ink bg-white px-2 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Navn"
            />
            <RetroCheckbox
              label="Kan være notatfører"
              checked={canBeNoteTaker}
              onChange={(e) => setCanBeNoteTaker(e.target.checked)}
            />
            <RetroButton type="submit" disabled={!name.trim()}>
              Legg til
            </RetroButton>
          </form>
        </RetroPanel>

        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.id}>
              <RetroPanel className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{p.data.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <RetroCheckbox
                    label="Notatfører"
                    checked={p.data.canBeNoteTaker}
                    onChange={(e) => updatePlayer(p.id, { canBeNoteTaker: e.target.checked })}
                  />
                  <button
                    type="button"
                    className="p-1 text-negative"
                    aria-label={`Slett ${p.data.name}`}
                    onClick={() => handleDelete(p.id, p.data.name)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </RetroPanel>
            </li>
          ))}
        </ul>
        {players.length === 0 && <p className="text-sm text-ink/60">Ingen spillere ennå.</p>}
      </div>
      {dialog}
    </div>
  );
}
