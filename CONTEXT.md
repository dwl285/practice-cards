# Guitar Practice Trainer

This context models deliberate guitar practice around short, difficult excerpts of songs. It exists to keep the language around songs, excerpts, tempo progress, and scheduling precise as the product evolves.

## Language

**Song**:
A musical work that can contain one or more practice-worthy excerpts. A Song groups related Practice Items without merging their progress, and in v1 it is created implicitly through Practice Item entry rather than managed separately.
_Avoid_: Track, tune, piece

**Artist**:
An optional attribution for the performer, writer, or source associated with a Song. It is absent when the Song is traditional, personal, or otherwise not usefully tied to a named artist.
_Avoid_: Band, owner, author

**Practice Item**:
Exactly one fixed excerpt from a song that is practiced as a unit. It has its own tempo progress and review schedule, even when other Practice Items belong to the same Song.
_Avoid_: Card, lick, section bundle

**Practice Notes**:
Optional free-text reminders attached to a Practice Item that help the player execute it correctly. Practice Notes capture advice about technique or attention, not the identity of the excerpt.
_Avoid_: Description, diary, transcript

**Current BPM**:
The working tempo shown for a Practice Item at the start of practice. If Tempo Checkpoints exist, Current BPM is derived from the latest saved checkpoint; otherwise it may be unset.
_Avoid_: Default BPM, live BPM, temp BPM

**Starting BPM**:
The universal fallback tempo used when a Practice Item has no saved Tempo Checkpoint yet. In v1 the Starting BPM is 70 BPM.
_Avoid_: Bootstrap BPM, seed tempo, initial guess

**Reference Text**:
The canonical free-text description that identifies the excerpt inside a Practice Item. It captures how the player recognizes the excerpt, even when no structured location is available.
_Avoid_: Label, blob, prompt

**Practice Session**:
One app visit in which Practice Items are surfaced, worked on, skipped, or saved. A Practice Session can reorder items temporarily without changing their durable progress.
_Avoid_: Workout, run, round

**Practice Queue**:
The ordered set of Practice Items presented during a Practice Session. The next item in the Practice Queue is the one the player should work on now.
_Avoid_: Feed, backlog, playlist

**New Item Boost**:
A temporary priority increase applied to a newly created Practice Item so it appears near the front of the Practice Queue. It does not automatically override the current item in progress.
_Avoid_: Pin, force-top, interrupt

**Archive**:
A durable state that keeps a Practice Item in the library while removing it from the Practice Queue. An archived Practice Item can be restored later without losing its history.
_Avoid_: Delete, finish, complete

**Practice Priority**:
The ordering weight used to place a Practice Item in the Practice Queue. In this product it is driven primarily by newness, recency, progress toward Target BPM when present, and temporary session skips.
_Avoid_: Score, rank, difficulty

**Skip**:
A session-only choice to defer a Practice Item without saving new progress. A Skip changes ordering inside the current Practice Session but does not create history or alter the long-term schedule.
_Avoid_: Fail, snooze, archive

**Target BPM**:
An optional goal tempo for a Practice Item. It represents the speed the player wants to reach, but a Practice Item remains valid even when no target has been decided yet.
_Avoid_: Max BPM, limit, cap

**Tempo Checkpoint**:
A saved record of the fastest controlled BPM reached for a Practice Item at the end of a practice session. A Tempo Checkpoint may move up or down from earlier checkpoints.
_Avoid_: Attempt, run, rep

**Song Playthrough**:
A synthetic, non-persisted card prompting a full, start-to-finish play of a Song at a comfortable pace. A small fixed number of Song Playthroughs is chosen at random each day, has no Target BPM or Tempo Checkpoint, and is dropped into the Practice Queue at a random position.
_Avoid_: Performance, run-through item, gig

**Queue Noise**:
A small, deterministic-per-day jitter added to Practice Priority so the next Practice Item is not perfectly predictable. Queue Noise perturbs ordering between similarly-ranked items without overriding newness or long neglect.
_Avoid_: Shuffle, randomizer, chaos
