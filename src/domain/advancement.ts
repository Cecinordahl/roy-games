import { distributeGroups, suggestGroupPlan, type GroupPlan } from './groupDistribution';

/**
 * Given each group's final player order (ties already resolved) and how many advance
 * per group, splits players into the winners table and the remaining pool.
 */
export interface AdvancementSplit {
  winnersPlayerIds: string[];
  remainingPlayerIds: string[];
}

export function proposeAdvancement(groupOrders: readonly string[][], advanceCount: number): AdvancementSplit {
  const winnersPlayerIds: string[] = [];
  const remainingPlayerIds: string[] = [];
  for (const order of groupOrders) {
    winnersPlayerIds.push(...order.slice(0, advanceCount));
    remainingPlayerIds.push(...order.slice(advanceCount));
  }
  return { winnersPlayerIds, remainingPlayerIds };
}

export interface AdvanceCountValidation {
  valid: boolean;
  suggestedAdvanceCount?: number;
  reason?: string;
}

/** Checks that `advanceCount` makes sense against every group's size. */
export function validateAdvanceCount(groupSizes: readonly number[], advanceCount: number): AdvanceCountValidation {
  const minGroupSize = Math.min(...groupSizes);
  if (!Number.isInteger(advanceCount) || advanceCount < 1) {
    return { valid: false, suggestedAdvanceCount: 1, reason: 'Antall som går videre må være minst 1.' };
  }
  if (advanceCount > minGroupSize) {
    return {
      valid: false,
      suggestedAdvanceCount: minGroupSize,
      reason: `Den minste gruppen har bare ${minGroupSize} spillere.`,
    };
  }
  return { valid: true };
}

/** Suggests the advance-per-group count that lands the winners table closest to 5-6 players. */
export function suggestAdvanceCount(groupSizes: readonly number[], target: [number, number] = [5, 6]): number {
  const groupCount = groupSizes.length;
  const minGroupSize = Math.min(...groupSizes);
  let best = 1;
  let bestDistance = Infinity;
  for (let n = 1; n <= minGroupSize; n++) {
    const winnersTableSize = n * groupCount;
    const distance =
      winnersTableSize < target[0]
        ? target[0] - winnersTableSize
        : winnersTableSize > target[1]
          ? winnersTableSize - target[1]
          : 0;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = n;
    }
  }
  return best;
}

/**
 * Plans further tables for the players who did not advance, reusing the same
 * group-sizing algorithm used for the initial stage (§4.3). Guaranteed to sum
 * back to `remainingCount` by construction — the "6 winners + 10 remaining must
 * split 5/5, not 6/5" arithmetic check is inherent, not a separate assertion.
 */
export function planRemainingTables(remainingCount: number): GroupPlan {
  if (remainingCount === 0) return { groupCount: 0, sizes: [] };
  return suggestGroupPlan(remainingCount);
}

export { distributeGroups };
