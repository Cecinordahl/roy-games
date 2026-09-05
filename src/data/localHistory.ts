// There are no accounts, so "tournaments I've visited" is a per-device convenience
// list in localStorage — not an access boundary. Anyone with the join code can still
// open (and this list will pick up) any tournament regardless of this list's contents.
import type { GameType } from '../domain/types';

const KEY = 'roy-games:recent-tournaments';

export interface RecentTournament {
  id: string;
  name: string;
  joinCode: string;
  game?: GameType;
  /** Best-effort cache of the organizer-set event date — may go stale if edited
   *  elsewhere without revisiting; `listAllTournaments` is the source of truth. */
  eventDate?: string;
  visitedAt: number;
}

export function getRecentTournaments(): RecentTournament[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentTournament[]) : [];
  } catch {
    return [];
  }
}

export function rememberTournament(entry: Omit<RecentTournament, 'visitedAt'>): void {
  try {
    const existing = getRecentTournaments().filter((t) => t.id !== entry.id);
    const updated = [{ ...entry, visitedAt: Date.now() }, ...existing].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private mode, etc.) — the shortcut list just won't persist.
  }
}

export function forgetTournament(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getRecentTournaments().filter((t) => t.id !== id)));
  } catch {
    // ignore
  }
}
