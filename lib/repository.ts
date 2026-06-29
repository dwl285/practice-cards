import { prisma } from "@/lib/prisma";
import { dayKey, noisyPosition } from "@/lib/practice-noise";
import { STARTING_BPM, sortPracticeQueue } from "@/lib/practice-priority";
import type { PracticeItemPayload, PracticeItemView, SongPayload, SongView } from "@/lib/types";

// How many full-song playthrough cards to surface each day.
const DAILY_PLAYTHROUGH_COUNT = 2;

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapItem(item: {
  id: string;
  title: string;
  referenceText: string;
  practiceNotes: string | null;
  targetBpm: number | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  song: { id: string; title: string; capo: number | null; artist: { name: string } | null };
  checkpoints: { bpm: number; createdAt: Date }[];
}): PracticeItemView {
  const latestCheckpoint = item.checkpoints[0] ?? null;

  return {
    id: item.id,
    songId: item.song.id,
    songTitle: item.song.title,
    artist: item.song.artist?.name ?? null,
    capo: item.song.capo,
    title: item.title,
    referenceText: item.referenceText,
    practiceNotes: item.practiceNotes,
    targetBpm: item.targetBpm,
    currentBpm: latestCheckpoint?.bpm ?? null,
    startingBpm: STARTING_BPM,
    lastPractisedAt: latestCheckpoint?.createdAt.toISOString() ?? null,
    archived: item.archived,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    isNew: latestCheckpoint === null
  };
}

export async function listPracticeItems(includeArchived = false): Promise<PracticeItemView[]> {
  const items = await prisma.practiceItem.findMany({
    where: includeArchived ? undefined : { archived: false },
    include: {
      song: { include: { artist: true } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return items.map(mapItem);
}

// Pick a stable-per-day set of songs (drawn from those with active items) and
// turn each into a synthetic full-playthrough card.
function buildDailyPlaythroughs(items: PracticeItemView[], seed: string): PracticeItemView[] {
  const songs = new Map<string, PracticeItemView>();
  for (const item of items) {
    if (!songs.has(item.songId)) {
      songs.set(item.songId, item);
    }
  }

  const now = new Date().toISOString();

  return [...songs.values()]
    .sort((left, right) => noisyPosition(left.songId, `${seed}|pick`, 1_000_000) - noisyPosition(right.songId, `${seed}|pick`, 1_000_000))
    .slice(0, DAILY_PLAYTHROUGH_COUNT)
    .map((item) => ({
      id: `playthrough:${item.songId}:${seed}`,
      songId: item.songId,
      songTitle: item.songTitle,
      artist: item.artist,
      capo: item.capo,
      title: "Full playthrough",
      referenceText: "Play the whole song through at a pace you enjoy.",
      practiceNotes: null,
      targetBpm: null,
      currentBpm: null,
      startingBpm: STARTING_BPM,
      lastPractisedAt: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
      isNew: false,
      isPlaythrough: true
    }));
}

export async function getPracticeQueue(): Promise<PracticeItemView[]> {
  const seed = dayKey();
  const items = await listPracticeItems(false);
  const queue = sortPracticeQueue(items, seed);

  const playthroughs = buildDailyPlaythroughs(items, seed);
  for (const playthrough of playthroughs) {
    queue.splice(noisyPosition(playthrough.id, seed, queue.length), 0, playthrough);
  }

  return queue;
}

async function findOrCreateArtist(artist?: string) {
  const name = normalizeText(artist);
  if (!name) {
    return null;
  }

  return prisma.artist.upsert({
    where: { name },
    update: {},
    create: { name }
  });
}

async function findOrCreateSong(songTitle: string, artist?: string) {
  const title = songTitle.trim();
  const artistRecord = await findOrCreateArtist(artist);
  const artistId = artistRecord?.id ?? null;

  const existing = await prisma.song.findFirst({
    where: { title, artistId }
  });

  if (existing) {
    return existing;
  }

  return prisma.song.create({
    data: { title, artistId }
  });
}

export async function createPracticeItem(payload: PracticeItemPayload): Promise<PracticeItemView> {
  const song = await findOrCreateSong(payload.songTitle, payload.artist);

  const item = await prisma.practiceItem.create({
    data: {
      songId: song.id,
      title: payload.title.trim(),
      referenceText: payload.referenceText.trim(),
      practiceNotes: normalizeText(payload.practiceNotes),
      targetBpm: payload.targetBpm ?? null
    },
    include: {
      song: { include: { artist: true } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return mapItem(item);
}

export async function updatePracticeItem(id: string, payload: PracticeItemPayload): Promise<PracticeItemView> {
  const song = await findOrCreateSong(payload.songTitle, payload.artist);

  const item = await prisma.practiceItem.update({
    where: { id },
    data: {
      songId: song.id,
      title: payload.title.trim(),
      referenceText: payload.referenceText.trim(),
      practiceNotes: normalizeText(payload.practiceNotes),
      targetBpm: payload.targetBpm ?? null
    },
    include: {
      song: { include: { artist: true } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return mapItem(item);
}

export async function archivePracticeItem(id: string, archived: boolean): Promise<PracticeItemView> {
  const item = await prisma.practiceItem.update({
    where: { id },
    data: { archived },
    include: {
      song: { include: { artist: true } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return mapItem(item);
}

export async function deletePracticeItem(id: string): Promise<void> {
  await prisma.practiceItem.delete({ where: { id } });
}

export async function listSongs(): Promise<SongView[]> {
  const songs = await prisma.song.findMany({
    include: { artist: true, items: { select: { id: true } } },
    orderBy: [{ title: "asc" }]
  });

  return songs.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist?.name ?? null,
    capo: song.capo,
    itemCount: song.items.length
  }));
}

export async function updateSong(id: string, payload: SongPayload): Promise<SongView> {
  const artistRecord = await findOrCreateArtist(payload.artist ?? undefined);
  const title = payload.title?.trim();

  const song = await prisma.song.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      artistId: artistRecord?.id ?? null,
      capo: payload.capo ?? null
    },
    include: { artist: true, items: { select: { id: true } } }
  });

  return {
    id: song.id,
    title: song.title,
    artist: song.artist?.name ?? null,
    capo: song.capo,
    itemCount: song.items.length
  };
}

export class SongHasItemsError extends Error {
  constructor() {
    super("SONG_HAS_ITEMS");
    this.name = "SongHasItemsError";
  }
}

export async function deleteSong(id: string): Promise<void> {
  const itemCount = await prisma.practiceItem.count({ where: { songId: id } });

  if (itemCount > 0) {
    throw new SongHasItemsError();
  }

  await prisma.song.delete({ where: { id } });
}

export async function saveTempoCheckpoint(id: string, bpm: number): Promise<PracticeItemView> {
  await prisma.tempoCheckpoint.create({
    data: {
      practiceItemId: id,
      bpm
    }
  });

  const item = await prisma.practiceItem.findUniqueOrThrow({
    where: { id },
    include: {
      song: { include: { artist: true } },
      checkpoints: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  return mapItem(item);
}
