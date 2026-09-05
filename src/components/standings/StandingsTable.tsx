import type { Standing } from '../../domain/types';
import { ScoreValue } from '../layout/ScoreValue';

interface StandingsTableProps {
  standings: Standing[];
  playerNames: Record<string, string>;
  /** Highlights the players who would advance, if given. */
  advanceCount?: number;
}

export function StandingsTable({ standings, playerNames, advanceCount }: StandingsTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b-2 border-ink text-left">
          <th className="py-1 pr-2">#</th>
          <th className="py-1 pr-2">Spiller</th>
          <th className="py-1 text-right">Poeng</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s, i) => (
          <tr
            key={s.playerId}
            className={`border-b border-ink/20 ${advanceCount !== undefined && i < advanceCount ? 'bg-sage/30' : ''}`}
          >
            <td className="py-1 pr-2 tabular-nums">{i + 1}</td>
            <td className="py-1 pr-2">{playerNames[s.playerId] ?? s.playerId}</td>
            <td className="py-1 text-right">
              <ScoreValue value={s.total} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
