import "server-only";

import type { PracticeItemView } from "@/lib/types";

export const STARTING_BPM = 70;

function daysSince(dateString: string | null): number {
  if (!dateString) {
    return Number.MAX_SAFE_INTEGER;
  }

  const diff = Date.now() - new Date(dateString).getTime();
  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

function targetGap(item: PracticeItemView): number {
  if (!item.targetBpm || !item.currentBpm) {
    return -1;
  }

  return item.targetBpm - item.currentBpm;
}

export function computePracticePriority(item: PracticeItemView): [number, number, number, number] {
  return [
    item.isNew ? 1 : 0,
    daysSince(item.lastPractisedAt),
    targetGap(item),
    -new Date(item.updatedAt).getTime()
  ];
}

export function sortPracticeQueue(items: PracticeItemView[]): PracticeItemView[] {
  return [...items].sort((left, right) => {
    const leftPriority = computePracticePriority(left);
    const rightPriority = computePracticePriority(right);

    for (let index = 0; index < leftPriority.length; index += 1) {
      const delta = rightPriority[index] - leftPriority[index];
      if (delta !== 0) {
        return delta;
      }
    }

    return left.title.localeCompare(right.title);
  });
}
