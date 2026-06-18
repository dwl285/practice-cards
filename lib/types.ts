export type PracticeItemView = {
  id: string;
  songTitle: string;
  artist: string | null;
  title: string;
  referenceText: string;
  practiceNotes: string | null;
  targetBpm: number | null;
  currentBpm: number | null;
  startingBpm: number;
  lastPractisedAt: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  isNew: boolean;
};

export type PracticeItemPayload = {
  songTitle: string;
  artist?: string;
  title: string;
  referenceText: string;
  practiceNotes?: string;
  targetBpm?: number | null;
};
