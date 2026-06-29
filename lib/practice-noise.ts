// Shared, deterministic randomness for the practice queue. Both the server-built
// queue and the client-side re-sort import from here so that ordering stays
// stable within a day (no jarring reshuffles) while still varying day to day.

// How many "days" of wobble we allow when nudging recency-based priority. Big
// enough that the next card isn't perfectly predictable, small enough that a
// long-neglected item still surfaces ahead of one practised today.
export const PRIORITY_NOISE_DAYS = 4;

// A stable key for "today" used to seed all per-day randomness. UTC keeps the
// server render and the value we hand to the client in agreement.
export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Deterministic hash of a string into the unit interval [0, 1).
function seededUnit(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

// Per-item, per-day jitter (in days) added to recency-based priority.
export function priorityNoise(id: string, seed: string): number {
  return seededUnit(`${id}|priority|${seed}`) * PRIORITY_NOISE_DAYS;
}

// Per-item, per-day position used to drop playthrough cards somewhere random
// in a queue of the given length.
export function noisyPosition(id: string, seed: string, length: number): number {
  return Math.floor(seededUnit(`${id}|position|${seed}`) * (length + 1));
}
