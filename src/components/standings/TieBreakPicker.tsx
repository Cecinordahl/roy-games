import { useState } from 'react';
import { RetroButton } from '../layout/RetroButton';

interface TieBreakPickerProps {
  tiedPlayerIds: string[];
  playerNames: Record<string, string>;
  onResolve: (order: string[]) => void;
}

/** Manual tie-break: organizer taps players in the order they should rank, best first. */
export function TieBreakPicker({ tiedPlayerIds, playerNames, onResolve }: TieBreakPickerProps) {
  const [order, setOrder] = useState<string[]>([]);
  const remaining = tiedPlayerIds.filter((id) => !order.includes(id));

  function pick(id: string) {
    const next = [...order, id];
    setOrder(next);
    if (next.length === tiedPlayerIds.length) onResolve(next);
  }

  return (
    <div className="space-y-2 border-2 border-ink bg-yellow p-3">
      <p className="text-sm font-semibold">Uavgjort. Trykk på spillerne i rekkefølge, beste først:</p>
      {order.length > 0 && (
        <ol className="list-decimal space-y-0.5 pl-5 text-sm">
          {order.map((id) => (
            <li key={id}>{playerNames[id] ?? id}</li>
          ))}
        </ol>
      )}
      <div className="flex flex-wrap gap-2">
        {remaining.map((id) => (
          <RetroButton key={id} type="button" variant="secondary" onClick={() => pick(id)}>
            {playerNames[id] ?? id}
          </RetroButton>
        ))}
      </div>
    </div>
  );
}
