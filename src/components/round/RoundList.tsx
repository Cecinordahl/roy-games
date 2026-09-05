import type { RoundDoc, WithId } from '../../data/types';
import { ScoreValue } from '../layout/ScoreValue';

interface RoundListProps {
  rounds: WithId<RoundDoc>[];
  playerIds: string[];
  playerNames: Record<string, string>;
  canEdit: boolean;
  onEdit: (roundNumber: number) => void;
}

export function RoundList({ rounds, playerIds, playerNames, canEdit, onEdit }: RoundListProps) {
  if (rounds.length === 0) {
    return <p className="text-sm text-ink/60">Ingen runder spilt ennå.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="py-1 pr-2">Runde</th>
            {playerIds.map((id) => (
              <th key={id} className="py-1 pr-2">
                {playerNames[id] ?? id}
              </th>
            ))}
            {canEdit && <th />}
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="border-b border-ink/20">
              <td className="py-1 pr-2 tabular-nums">
                {r.data.roundNumber}
                {r.data.cards !== undefined ? ` (${r.data.cards})` : ''}
              </td>
              {playerIds.map((id) => (
                <td key={id} className="py-1 pr-2">
                  <ScoreValue value={r.data.scores[id] ?? 0} />
                  {r.data.bids && r.data.tricks && (
                    <span className="ml-1 text-xs text-ink/50">
                      ({r.data.bids[id] ?? 0}/{r.data.tricks[id] ?? 0})
                    </span>
                  )}
                </td>
              ))}
              {canEdit && (
                <td className="py-1 text-right">
                  <button type="button" className="text-xs underline" onClick={() => onEdit(r.data.roundNumber)}>
                    Endre
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
