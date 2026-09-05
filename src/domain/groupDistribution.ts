/**
 * Table/group sizing. Not Bondebridge-specific — any card-game tournament
 * splitting players into parallel tables would want this.
 */

const PREFERRED_MIN = 4;
const PREFERRED_MAX = 6;

export interface GroupPlan {
  groupCount: number;
  sizes: number[];
  warning?: string;
}

export function suggestGroupCount(playerCount: number): number {
  return Math.max(1, Math.round(playerCount / 5));
}

/** Splits `playerCount` as evenly as possible across `groupCount` groups. */
export function distributeGroups(playerCount: number, groupCount: number): number[] {
  const base = Math.floor(playerCount / groupCount);
  const remainder = playerCount % groupCount;
  return Array.from({ length: groupCount }, (_, i) => (i < remainder ? base + 1 : base));
}

export function sizesInRange(sizes: number[], min = PREFERRED_MIN, max = PREFERRED_MAX): boolean {
  return sizes.every((s) => s >= min && s <= max);
}

/** A short Norwegian warning for a table size outside the comfortable 4-6 range. */
export function sizeWarning(size: number): string | undefined {
  if (size < PREFERRED_MIN || size > PREFERRED_MAX) {
    return `Uvanlig bordstørrelse (${size} spillere) — anbefalt er 4–6.`;
  }
  return undefined;
}

/**
 * Suggests a group count for `playerCount`, preferring `round(n/5)` groups but
 * trying one more or one fewer group if that keeps every group's size inside 4-6.
 */
export function suggestGroupPlan(playerCount: number): GroupPlan {
  const suggested = suggestGroupCount(playerCount);
  const candidates = [suggested, suggested + 1, suggested - 1].filter((g) => g >= 1);

  for (const groupCount of candidates) {
    const sizes = distributeGroups(playerCount, groupCount);
    if (sizesInRange(sizes)) {
      return { groupCount, sizes };
    }
  }

  const sizes = distributeGroups(playerCount, suggested);
  return {
    groupCount: suggested,
    sizes,
    warning: 'Gruppestørrelsen havner utenfor det anbefalte området (4–6 spillere).',
  };
}

/** Fisher-Yates shuffle; does not mutate the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Splits an already-ordered/shuffled list into groups of the given sizes. */
export function splitIntoGroups<T>(items: readonly T[], sizes: number[]): T[][] {
  const total = sizes.reduce((a, b) => a + b, 0);
  if (total !== items.length) {
    throw new Error(`Group sizes (${total}) do not add up to item count (${items.length})`);
  }
  const groups: T[][] = [];
  let offset = 0;
  for (const size of sizes) {
    groups.push(items.slice(offset, offset + size));
    offset += size;
  }
  return groups;
}

/**
 * Picks a random note taker for a table, preferring players flagged eligible.
 * Falls back to the whole table if nobody in it is eligible (e.g. a table that,
 * by chance, drew only ineligible players).
 */
export function pickNoteTaker(playerIds: readonly string[], eligiblePlayerIds: ReadonlySet<string>): string {
  const eligible = playerIds.filter((id) => eligiblePlayerIds.has(id));
  const pool = eligible.length > 0 ? eligible : playerIds;
  return pool[Math.floor(Math.random() * pool.length)];
}
