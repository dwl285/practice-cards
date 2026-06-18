import type { PracticeItemView } from "@/lib/types";

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

function computePracticePriority(item: PracticeItemView): [number, number, number, number] {
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

export function getDisplayBpm(item: Pick<PracticeItemView, "currentBpm" | "startingBpm">): number {
  return item.currentBpm ?? item.startingBpm;
}

export function insertNearFront(queue: PracticeItemView[], item: PracticeItemView): PracticeItemView[] {
  if (queue.length <= 1) {
    return [...queue, item];
  }

  return [queue[0], item, ...queue.slice(1)];
}

export function skipWithinQueue(queue: PracticeItemView[]): PracticeItemView[] {
  if (queue.length <= 1) {
    return queue;
  }

  const [current, ...rest] = queue;
  const insertionIndex = Math.min(2, rest.length);
  return [...rest.slice(0, insertionIndex), current, ...rest.slice(insertionIndex)];
}

export function formatPracticeDate(value: string | null): string {
  if (!value) {
    return "Never saved";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}
