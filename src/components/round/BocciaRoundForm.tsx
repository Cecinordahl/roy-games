import { useState } from 'react';
import { RetroButton } from '../layout/RetroButton';
import { RetroPanel } from '../layout/RetroPanel';

interface BocciaRoundFormProps {
  participantIds: string[];
  participantNames: Record<string, string>;
  initialClosestId?: string;
  initialBallHitIds?: string[];
  onSave: (closestId: string, ballHitIds: string[]) => void;
  onCancel?: () => void;
}

export function BocciaRoundForm({
  participantIds,
  participantNames,
  initialClosestId,
  initialBallHitIds,
  onSave,
  onCancel,
}: BocciaRoundFormProps) {
  const [closestId, setClosestId] = useState(initialClosestId ?? '');
  const [ballHitIds, setBallHitIds] = useState<string[]>(initialBallHitIds ?? []);

  function toggleBallHit(id: string) {
    setBallHitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <RetroPanel className="space-y-4">
      <div>
        <p className="text-xl font-bold text-ink">Hvem var nærmest?</p>
        <ul className="mt-2 space-y-1">
          {participantIds.map((id) => (
            <li key={id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="closest" checked={closestId === id} onChange={() => setClosestId(id)} />
                {participantNames[id] ?? id}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xl font-bold text-ink">Hvem traff den hvite kula?</p>
        <p className="mb-2 text-sm text-ink/60">Ekstra poeng for hver som traff — ingen, én eller flere.</p>
        <ul className="space-y-1">
          {participantIds.map((id) => (
            <li key={id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ballHitIds.includes(id)} onChange={() => toggleBallHit(id)} />
                {participantNames[id] ?? id}
              </label>
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
        <RetroButton type="button" onClick={() => onSave(closestId, ballHitIds)} disabled={!closestId}>
          Lagre runde
        </RetroButton>
      </div>
    </RetroPanel>
  );
}
