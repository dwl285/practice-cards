export type PracticeItemView = {
  id: string;
  songId: string;
  songTitle: string;
  artist: string | null;
  capo: number | null;
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
  // True for synthetic "play the whole song through" cards. These are generated
  // per day, are not persisted, and have no tempo tracking.
  isPlaythrough?: boolean;
};

export type PracticeItemPayload = {
  songTitle: string;
  artist?: string;
  title: string;
  referenceText: string;
  practiceNotes?: string;
  targetBpm?: number | null;
};

export type SongView = {
  id: string;
  title: string;
  artist: string | null;
  capo: number | null;
  itemCount: number;
};

export type SongPayload = {
  title?: string;
  artist?: string | null;
  capo?: number | null;
};
