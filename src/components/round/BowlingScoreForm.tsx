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

export function BowlingScoreForm({ playerIds, playerNames, initialScores, onSave, onCancel }: BowlingScoreFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    () => initialScores ?? Object.fromEntries(playerIds.map((id) => [id, 0])),
  );

  const allValid = playerIds.every((id) => isValidBowlingScore(scores[id] ?? 0));

  function setScore(id: string, value: number) {
    setScores((prev) => ({ ...prev, [id]: Math.max(0, Math.min(300, value)) }));
  }

  return (
    <RetroPanel className="space-y-3">
      <p className="text-xl font-bold text-ink">Poeng denne runden</p>
      <ul className="space-y-2">
        {playerIds.map((id) => (
          <li key={id} className="flex items-center justify-between gap-2">
            <span>{playerNames[id] ?? id}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={300}
              className="w-20 border-2 border-ink bg-white px-2 py-1 text-right tabular-nums"
              value={scores[id] ?? 0}
              onChange={(e) => setScore(id, Number(e.target.value) || 0)}
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
        <RetroButton type="button" onClick={() => onSave(scores)} disabled={!allValid}>
          Lagre runde
        </RetroButton>
      </div>
    </RetroPanel>
  );
}
