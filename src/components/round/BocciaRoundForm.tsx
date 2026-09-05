import { useState } from 'react';
import { RetroButton } from '../layout/RetroButton';
import { RetroPanel } from '../layout/RetroPanel';

interface BocciaRoundFormProps {
  participantIds: string[];
  participantNames: Record<string, string>;
  initialClosestId?: string;
  initialClosestDoubled?: boolean;
  initialBallHitCounts?: Record<string, number>;
  onSave: (closestId: string, closestDoubled: boolean, ballHitCounts: Record<string, number>) => void;
  onCancel?: () => void;
}

function HitCountStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="h-8 w-8 border-2 border-ink bg-surface font-bold shadow-chunky-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        −
      </button>
      <span className="w-4 text-center tabular-nums font-semibold">{value}</span>
      <button
        type="button"
        className="h-8 w-8 border-2 border-ink bg-surface font-bold shadow-chunky-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        onClick={() => onChange(Math.min(2, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export function BocciaRoundForm({
  participantIds,
  participantNames,
  initialClosestId,
  initialClosestDoubled,
  initialBallHitCounts,
  onSave,
  onCancel,
}: BocciaRoundFormProps) {
  const [closestId, setClosestId] = useState(initialClosestId ?? '');
  const [closestDoubled, setClosestDoubled] = useState(initialClosestDoubled ?? false);
  const [ballHitCounts, setBallHitCounts] = useState<Record<string, number>>(initialBallHitCounts ?? {});

  function selectClosest(id: string) {
    setClosestId(id);
    setClosestDoubled(false);
  }

  function setHitCount(id: string, count: number) {
    setBallHitCounts((prev) => ({ ...prev, [id]: count }));
  }

  return (
    <RetroPanel className="space-y-4">
      <div>
        <p className="text-xl font-bold text-ink">Hvem var nærmest?</p>
        <ul className="mt-2 space-y-1">
          {participantIds.map((id) => (
            <li key={id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="closest" checked={closestId === id} onChange={() => selectClosest(id)} />
                {participantNames[id] ?? id}
              </label>
            </li>
          ))}
        </ul>
        {closestId && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={closestDoubled}
              onChange={(e) => setClosestDoubled(e.target.checked)}
            />
            Hadde begge kulene nærmest (2 poeng i stedet for 1)
          </label>
        )}
      </div>

      <div>
        <p className="text-xl font-bold text-ink">Hvem traff den hvite kula?</p>
        <p className="mb-2 text-sm text-ink/60">
          Ekstra poeng per kule som traff — 0, 1 eller 2 per lag/spiller (et lag med to spillere kan treffe én gang
          hver; en enkeltspiller kan treffe med begge kulene sine).
        </p>
        <ul className="space-y-2">
          {participantIds.map((id) => (
            <li key={id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{participantNames[id] ?? id}</span>
              <HitCountStepper value={ballHitCounts[id] ?? 0} onChange={(count) => setHitCount(id, count)} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <RetroButton type="button" variant="secondary" onClick={onCancel}>
            Avbryt
          </RetroButton>
        )}
        <RetroButton
          type="button"
          onClick={() => onSave(closestId, closestDoubled, ballHitCounts)}
          disabled={!closestId}
        >
          Lagre runde
        </RetroButton>
      </div>
    </RetroPanel>
  );
}
