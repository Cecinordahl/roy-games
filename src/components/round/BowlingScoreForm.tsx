import { useState } from 'react';
import { isValidBowlingScore } from '../../domain/bowling/scoring';
import { RetroButton } from '../layout/RetroButton';
import { RetroPanel } from '../layout/RetroPanel';

interface BowlingScoreFormProps {
  playerIds: string[];
  playerNames: Record<string, string>;
  initialScores?: Record<string, number>;
  onSave: (scores: Record<string, number>) => void;
  onCancel?: () => void;
}

/** Raw digit strings, not numbers — keeps the field genuinely empty until the organizer types something. */
function toInitialStrings(playerIds: string[], initialScores?: Record<string, number>): Record<string, string> {
  if (!initialScores) return Object.fromEntries(playerIds.map((id) => [id, '']));
  return Object.fromEntries(playerIds.map((id) => [id, String(initialScores[id] ?? '')]));
}

export function BowlingScoreForm({ playerIds, playerNames, initialScores, onSave, onCancel }: BowlingScoreFormProps) {
  const [scores, setScores] = useState<Record<string, string>>(() => toInitialStrings(playerIds, initialScores));

  const allValid = playerIds.every((id) => {
    const raw = scores[id] ?? '';
    return raw !== '' && isValidBowlingScore(Number(raw));
  });

  function setScore(id: string, raw: string) {
    setScores((prev) => ({ ...prev, [id]: raw.replace(/\D/g, '') }));
  }

  function handleSave() {
    onSave(Object.fromEntries(playerIds.map((id) => [id, Number(scores[id])])));
  }

  return (
    <RetroPanel className="space-y-3">
      <p className="text-xl font-bold text-ink">Poeng denne runden</p>
      <ul className="space-y-2">
        {playerIds.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2">
            <span>{playerNames[id] ?? id}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              className="w-20 border-2 border-ink bg-white px-2 py-1 text-right tabular-nums"
              value={scores[id] ?? ''}
              onChange={(e) => setScore(id, e.target.value)}
            />
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <RetroButton type="button" variant="secondary" onClick={onCancel}>
            Avbryt
          </RetroButton>
        )}
        <RetroButton type="button" onClick={handleSave} disabled={!allValid}>
          Lagre runde
        </RetroButton>
      </div>
    </RetroPanel>
  );
}
