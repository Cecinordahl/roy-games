import { useState } from 'react';
import { PencilIcon } from '../layout/PencilIcon';
import { RetroButton } from '../layout/RetroButton';
import { RetroPanel } from '../layout/RetroPanel';
import { RetroSelect } from '../layout/RetroSelect';

interface GroupsEditorProps {
  groups: string[][];
  noteTakers: string[];
  playerNames: Record<string, string>;
  eligibleIds: Set<string>;
  /** "Gruppe" for Bondis, "Bane" for bowling. */
  groupLabel: string;
  onReshuffle: () => void;
  onMovePlayer: (playerId: string, fromGroupIndex: number, toGroupIndex: number) => void;
  onNoteTakerChange: (groupIndex: number, playerId: string) => void;
}

/**
 * Manual override for the randomized groups/lanes — e.g. the bowling alley already
 * assigned specific lanes, and the organizer needs to match reality rather than
 * whatever the shuffle produced.
 */
export function GroupsEditor({
  groups,
  noteTakers,
  playerNames,
  eligibleIds,
  groupLabel,
  onReshuffle,
  onMovePlayer,
  onNoteTakerChange,
}: GroupsEditorProps) {
  const [editing, setEditing] = useState(false);

  return (
    <RetroPanel>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{groupLabel}r</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`p-1 ${editing ? 'text-sage-dark' : 'text-ink/60'}`}
            aria-label={editing ? 'Ferdig med å endre' : `Endre hvem som er i hvilken ${groupLabel.toLowerCase()}`}
            onClick={() => setEditing((v) => !v)}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <RetroButton type="button" variant="secondary" onClick={onReshuffle}>
            Stokke om
          </RetroButton>
        </div>
      </div>

      {editing && (
        <p className="mb-2 text-xs text-ink/60">
          Velg hvilken {groupLabel.toLowerCase()} hver spiller skal sitte i.
        </p>
      )}

      <div className="space-y-3">
        {groups.map((group, groupIndex) => {
          const eligibleInGroup = group.filter((id) => eligibleIds.has(id));
          const noteTakerOptions = eligibleInGroup.length > 0 ? eligibleInGroup : group;

          return (
            <div key={groupIndex} className="border-2 border-ink/30 p-3">
              <p className="text-xs font-semibold text-ink/70">
                {groupLabel} {groupIndex + 1}
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {group.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <span>{playerNames[id] ?? id}</span>
                    {editing && (
                      <select
                        className="border border-ink bg-white px-1 py-0.5 text-xs"
                        value={groupIndex}
                        onChange={(e) => onMovePlayer(id, groupIndex, Number(e.target.value))}
                      >
                        {groups.map((_, targetIndex) => (
                          <option key={targetIndex} value={targetIndex}>
                            {groupLabel} {targetIndex + 1}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>

              <label className="mb-1 mt-2 block text-xs font-semibold text-ink/80" htmlFor={`noteTaker-${groupIndex}`}>
                Notatfører
              </label>
              <RetroSelect
                id={`noteTaker-${groupIndex}`}
                value={noteTakers[groupIndex]}
                onChange={(e) => onNoteTakerChange(groupIndex, e.target.value)}
              >
                {noteTakerOptions.map((id) => (
                  <option key={id} value={id}>
                    {playerNames[id] ?? id}
                  </option>
                ))}
              </RetroSelect>
              {eligibleInGroup.length === 0 && (
                <p className="mt-1 text-xs text-negative">
                  Ingen i denne {groupLabel.toLowerCase()}n er satt som notatfører-kandidat — velg likevel.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </RetroPanel>
  );
}
