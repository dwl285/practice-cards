import { prisma } from "@/lib/prisma";
import { STARTING_BPM, sortPracticeQueue } from "@/lib/practice-priority";
import type { PracticeItemPayload, PracticeItemView } from "@/lib/types";

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
  song: { title: string; artist: { name: string } | null };
  checkpoints: { bpm: number; createdAt: Date }[];
}): PracticeItemView {
  const latestCheckpoint = item.checkpoints[0] ?? null;

  return {
    id: item.id,
    songTitle: item.song.title,
    artist: item.song.artist?.name ?? null,
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

export async function getPracticeQueue(): Promise<PracticeItemView[]> {
  return sortPracticeQueue(await listPracticeItems(false));
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
