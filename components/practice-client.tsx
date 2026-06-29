"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import QuickAddSheet from "@/components/quick-add-sheet";
import {
  formatPracticeDate,
  getDisplayBpm,
  insertNearFront,
  skipWithinQueue,
  sortPracticeQueue
} from "@/lib/practice-ui";
import type { PracticeItemPayload, PracticeItemView } from "@/lib/types";

type PracticeClientProps = {
  initialQueue: PracticeItemView[];
};

function useMetronome(bpm: number) {
  const [running, setRunning] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const persisted = window.localStorage.getItem("metronome-running");
    setRunning(persisted === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("metronome-running", running ? "true" : "false");
  }, [running]);

  // Stop the metronome when leaving the practice page so it does not resume
  // (via the persisted flag) the next time the page mounts.
  useEffect(() => {
    return () => {
      window.localStorage.setItem("metronome-running", "false");
    };
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const context = audioRef.current ?? new AudioContext();
    audioRef.current = context;

    const tick = () => {
      const now = context.currentTime;

      // Triangle tone sweeping 2000 -> 900 Hz gives a woodblock-style click.
      const oscillator = context.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(2000, now);
      oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.03);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.5, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.041);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.06);
    };

    void context.resume().then(() => {
      tick();
      intervalRef.current = window.setInterval(tick, Math.round(60_000 / bpm));
    });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bpm, running]);

  return { running, setRunning };
}

export default function PracticeClient({ initialQueue }: PracticeClientProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const currentItem = queue[0] ?? null;
  const baseBpm = currentItem ? getDisplayBpm(currentItem) : 70;
  const [workingBpm, setWorkingBpm] = useState(baseBpm);
  const [dirty, setDirty] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);
  const { running, setRunning } = useMetronome(workingBpm);

  useEffect(() => {
    if (currentItem) {
      setWorkingBpm(getDisplayBpm(currentItem));
      setDirty(false);
    }
  }, [currentItem?.id]);

  async function createItem(payload: PracticeItemPayload) {
    try {
      const response = await fetch("/api/practice-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Could not create that practice item.");
      }

      const created: PracticeItemView = await response.json();
      setQueue((current) => insertNearFront(current, created));
      setSheetOpen(false);
      setNotice("Added.");
    } catch {
      throw new Error("Could not create that practice item.");
    }
  }

  async function saveCurrent() {
    if (!currentItem) {
      return;
    }

    setRunning(false);
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/practice-items/${currentItem.id}/checkpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bpm: workingBpm })
      });

      if (!response.ok) {
        setNotice("Could not save.");
        return;
      }

      const updated: PracticeItemView = await response.json();
      setQueue((current) => {
        const rest = current.filter((item) => item.id !== updated.id);
        return sortPracticeQueue([...rest, updated]);
      });
      setNotice(`Saved ${workingBpm} BPM.`);
    } catch {
      setNotice("Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function archiveCurrent() {
    if (!currentItem) {
      return;
    }

    setRunning(false);
    setBusy(true);
    try {
      const response = await fetch(`/api/practice-items/${currentItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true })
      });

      if (!response.ok) {
        setNotice("Could not archive.");
        return;
      }

      setQueue((current) => current.filter((item) => item.id !== currentItem.id));
      setNotice("Archived.");
    } catch {
      setNotice("Could not archive.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDiscard(onConfirm: () => void) {
    if (!dirty) {
      onConfirm();
      return;
    }

    setConfirmState({
      title: "Discard changes?",
      message: "You have unsaved BPM changes for this item.",
      confirmLabel: "Discard",
      onConfirm
    });
  }

  if (!currentItem) {
    return (
      <main className="shell">
        <div className="page stack">
          <div className="toolbar">
            <div className="toolbar-tabs">
              <span className="toolbar-link active">Play now</span>
              <Link className="toolbar-link" href="/library">
                Library
              </Link>
            </div>
            <button className="toolbar-add" type="button" onClick={() => {
              setRunning(false);
              setSheetOpen(true);
            }} aria-label="Add practice item">
              <span className="toolbar-add-icon" aria-hidden="true">+</span>
              Add
            </button>
          </div>

          <section className="card compact-card empty">
            <h1 className="compact-title">Queue cleared</h1>
            <p className="subtitle">No active items left.</p>
          </section>
        </div>

        <QuickAddSheet
          open={sheetOpen}
          title="Add a practice item"
          submitLabel="Add to queue"
          onClose={() => setSheetOpen(false)}
          onSubmit={createItem}
        />
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="page stack">
        <div className="toolbar">
          <div className="toolbar-tabs">
            <span className="toolbar-link active">Play now</span>
            <Link className="toolbar-link" href="/library">
              Library
            </Link>
          </div>
          <button className="toolbar-add" type="button" onClick={() => {
              setRunning(false);
              setSheetOpen(true);
            }} aria-label="Add practice item">
            <span className="toolbar-add-icon" aria-hidden="true">+</span>
            Add
          </button>
        </div>

        <section className="card compact-card">
          <div className="compact-head">
            <span className="eyebrow">Practice now</span>
            <span className="mini-status">{queue.length} active</span>
          </div>

          <div className="compact-heading">
            <h1 className="compact-title">
              {currentItem.songTitle}
              {currentItem.artist ? <span className="compact-artist"> / {currentItem.artist}</span> : null}
            </h1>
            {currentItem.capo !== null ? (
              <div className="compact-tags">
                <span className="pill">Capo {currentItem.capo}</span>
              </div>
            ) : null}
            <h2 className="compact-subtitle">{currentItem.title}</h2>
          </div>

          <p className="reference">{currentItem.referenceText}</p>
          {currentItem.practiceNotes ? <p className="compact-note">{currentItem.practiceNotes}</p> : null}

          <div className="compact-meta">
            <div>
              <span className="metric-label">Current</span>
              <strong>{currentItem.currentBpm ?? currentItem.startingBpm} BPM</strong>
            </div>
            <div>
              <span className="metric-label">Last saved</span>
              <strong>{formatPracticeDate(currentItem.lastPractisedAt)}</strong>
            </div>
          </div>

          <div className="tempo-display compact-tempo">
            <div className="tempo-main">
              <span className="tempo-caption">{dirty ? "Unsaved tempo" : "Working tempo"}</span>
              <span className="tempo-number">{workingBpm}</span>
            </div>
            <div className="tempo-target">
              <span className="tempo-caption">Target</span>
              <span className="tempo-target-number">{currentItem.targetBpm ?? "—"}</span>
            </div>
          </div>

          <div className="transport-grid">
            <button
              className="nudge-button"
              type="button"
              onClick={() => {
                setWorkingBpm((current) => Math.max(20, current - 5));
                setDirty(true);
              }}
            >
              -5
            </button>
            <button
              className="nudge-button"
              type="button"
              onClick={() => {
                setWorkingBpm((current) => Math.max(20, current - 1));
                setDirty(true);
              }}
            >
              -1
            </button>
            <button className={`transport-button ${running ? "active" : ""}`} type="button" onClick={() => setRunning((current) => !current)}>
              {running ? "Stop" : "Start"}
            </button>
            <button
              className="nudge-button"
              type="button"
              onClick={() => {
                setWorkingBpm((current) => current + 1);
                setDirty(true);
              }}
            >
              +1
            </button>
            <button
              className="nudge-button"
              type="button"
              onClick={() => {
                setWorkingBpm((current) => current + 5);
                setDirty(true);
              }}
            >
              +5
            </button>
          </div>

          <div className="compact-actions">
            <button className="button save" type="button" disabled={busy} onClick={saveCurrent}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() =>
                confirmDiscard(() => {
                  setRunning(false);
                  setQueue((current) => skipWithinQueue(current));
                  setNotice("Skipped.");
                  setConfirmState(null);
                })
              }
            >
              Skip
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                setConfirmState({
                  title: "Archive item?",
                  message: "This removes the item from the queue but keeps it in the library.",
                  confirmLabel: "Archive",
                  tone: "danger",
                  onConfirm: () => {
                    void archiveCurrent();
                    setConfirmState(null);
                  }
                })
              }
            >
              Archive
            </button>
          </div>

          {notice ? <p className={notice.startsWith("Saved") ? "success compact-notice" : "muted compact-notice"}>{notice}</p> : null}
        </section>
      </div>

      <QuickAddSheet
        open={sheetOpen}
        title="Add a practice item"
        submitLabel="Add to queue"
        onClose={() => setSheetOpen(false)}
        onSubmit={createItem}
      />

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => confirmState?.onConfirm()}
      />
    </main>
  );
}
