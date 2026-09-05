import { useState } from 'react';
import { roundScore } from '../../domain/bondebridge/scoring';
import { RetroButton } from '../layout/RetroButton';
import { RetroPanel } from '../layout/RetroPanel';

interface RoundEntryFormProps {
  playerIds: string[];
  playerNames: Record<string, string>;
  cards: number;
  initialBids?: Record<string, number>;
  initialTricks?: Record<string, number>;
  onSave: (bids: Record<string, number>, tricks: Record<string, number>, scores: Record<string, number>) => void;
  onCancel?: () => void;
}

type Phase = 'bidding' | 'tricks';

export function RoundEntryForm({
  playerIds,
  playerNames,
  cards,
  initialBids,
  initialTricks,
  onSave,
  onCancel,
}: RoundEntryFormProps) {
  const [phase, setPhase] = useState<Phase>('bidding');
  const [bids, setBids] = useState<Record<string, number>>(
    () => initialBids ?? Object.fromEntries(playerIds.map((id) => [id, 0])),
  );
  const [tricks, setTricks] = useState<Record<string, number> | null>(initialTricks ?? null);

  const biddenTotal = playerIds.reduce((sum, id) => sum + (bids[id] ?? 0), 0);
  const effectiveTricks = tricks ?? bids;
  const trickTotal = playerIds.reduce((sum, id) => sum + (effectiveTricks[id] ?? 0), 0);
  const balanced = trickTotal === cards;

  function setBid(id: string, value: number) {
    setBids((prev) => ({ ...prev, [id]: Math.max(0, Math.min(cards, value)) }));
  }

  function setTrick(id: string, value: number) {
    setTricks((prev) => ({ ...(prev ?? bids), [id]: Math.max(0, Math.min(cards, value)) }));
  }

  function goToTricks() {
    setTricks((prev) => prev ?? { ...bids });
    setPhase('tricks');
  }

  function handleSave() {
    const finalTricks = tricks ?? bids;
    const scores = Object.fromEntries(playerIds.map((id) => [id, roundScore(bids[id] ?? 0, finalTricks[id] ?? 0)]));
    onSave(bids, finalTricks, scores);
  }

  if (phase === 'bidding') {
    return (
      <RetroPanel className="space-y-3">
        <div>
          <p className="text-xl font-bold text-ink">Melding</p>
          <p className="mt-1 text-sm text-ink/70">
            {cards} kort denne runden. Meldt: {biddenTotal} av {cards}.
          </p>
        </div>
        <ul className="space-y-2">
          {playerIds.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2">
              <span>{playerNames[id] ?? id}</span>
              <Stepper value={bids[id] ?? 0} min={0} max={cards} onChange={(v) => setBid(id, v)} />
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <RetroButton type="button" variant="secondary" onClick={onCancel}>
              Avbryt
            </RetroButton>
          )}
          <RetroButton type="button" onClick={goToTricks}>
            Neste: stikk
          </RetroButton>
        </div>
      </RetroPanel>
    );
  }

  return (
    <RetroPanel className="space-y-3">
      <div>
        <p className="text-xl font-bold text-ink">Stikk</p>
        <p className="mt-1 text-sm text-ink/70">
          Registrert:{' '}
          <span className={`font-semibold ${balanced ? 'text-positive' : 'text-negative'}`}>
            {trickTotal} av {cards}
          </span>
        </p>
      </div>
      <ul className="space-y-2">
        {playerIds.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2">
            <span>
              {playerNames[id] ?? id} <span className="text-ink/50">(meldt {bids[id] ?? 0})</span>
            </span>
            <Stepper value={effectiveTricks[id] ?? 0} min={0} max={cards} onChange={(v) => setTrick(id, v)} />
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <RetroButton type="button" variant="secondary" onClick={() => setPhase('bidding')}>
          Tilbake
        </RetroButton>
        <RetroButton type="button" onClick={handleSave} disabled={!balanced}>
          Lagre runde
        </RetroButton>
      </div>
    </RetroPanel>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-9 w-9 border-2 border-ink bg-surface font-bold shadow-chunky-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="w-6 text-center tabular-nums font-semibold">{value}</span>
      <button
        type="button"
        className="h-9 w-9 border-2 border-ink bg-surface font-bold shadow-chunky-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}
