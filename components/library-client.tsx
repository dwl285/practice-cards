"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import QuickAddSheet from "@/components/quick-add-sheet";
import SongEditSheet from "@/components/song-edit-sheet";
import { formatPracticeDate, getDisplayBpm } from "@/lib/practice-ui";
import type { PracticeItemPayload, PracticeItemView, SongPayload, SongView } from "@/lib/types";

type LibraryClientProps = {
  initialItems: PracticeItemView[];
  initialSongs: SongView[];
};

type LibraryTab = "cards" | "songs";

export default function LibraryClient({ initialItems, initialSongs }: LibraryClientProps) {
  const [tab, setTab] = useState<LibraryTab>("cards");
  const [items, setItems] = useState(initialItems);
  const [songs, setSongs] = useState(initialSongs);
  const [editingItem, setEditingItem] = useState<PracticeItemView | null>(null);
  const [copyingItem, setCopyingItem] = useState<PracticeItemView | null>(null);
  const [editingSong, setEditingSong] = useState<SongView | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: "default" | "danger";
    onConfirm: () => void;
  } | null>(null);

  const orderedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        if (left.archived !== right.archived) {
          return left.archived ? 1 : -1;
        }

        return left.songTitle.localeCompare(right.songTitle) || left.title.localeCompare(right.title);
      }),
    [items]
  );

  async function postNewItem(payload: PracticeItemPayload): Promise<PracticeItemView> {
    const response = await fetch("/api/practice-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Could not create that practice item.");
    }

    const created: PracticeItemView = await response.json();
    setItems((current) => [...current, created]);
    return created;
  }

  async function createItem(payload: PracticeItemPayload) {
    try {
      await postNewItem(payload);
      setAdding(false);
      setMessage("Added.");
    } catch {
      throw new Error("Could not create that practice item.");
    }
  }

  async function copyItem(payload: PracticeItemPayload) {
    try {
      await postNewItem(payload);
      setCopyingItem(null);
      setMessage("Copied.");
    } catch {
      throw new Error("Could not create that practice item.");
    }
  }

  async function saveEdit(payload: PracticeItemPayload) {
    if (!editingItem) {
      return;
    }

    try {
      const response = await fetch(`/api/practice-items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Could not update that practice item.");
      }

      const updated: PracticeItemView = await response.json();
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingItem(null);
      setMessage("Saved.");
    } catch {
      throw new Error("Could not update that practice item.");
    }
  }

  async function saveSongEdit(id: string, payload: SongPayload) {
    const response = await fetch(`/api/songs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Could not update that song.");
    }

    const updated: SongView = await response.json();
    setSongs((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSong(null);
    setMessage("Saved.");
  }

  async function deleteSong(song: SongView) {
    try {
      const response = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error ?? "Could not delete that song.");
        return;
      }

      setSongs((current) => current.filter((entry) => entry.id !== song.id));
      setMessage("Deleted.");
    } catch {
      setMessage("Could not delete that song.");
    }
  }

  async function deleteItem(item: PracticeItemView) {
    try {
      const response = await fetch(`/api/practice-items/${item.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        setMessage("Could not delete that item.");
        return;
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Deleted.");
    } catch {
      setMessage("Could not delete that item.");
    }
  }

  async function toggleArchive(item: PracticeItemView) {
    try {
      const response = await fetch(`/api/practice-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !item.archived })
      });

      if (!response.ok) {
        setMessage("Could not change archive state.");
        return;
      }

      const updated: PracticeItemView = await response.json();
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setMessage(updated.archived ? "Archived." : "Restored.");
    } catch {
      setMessage("Could not change archive state.");
    }
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-tabs">
          <Link className="toolbar-link" href="/">
            Play now
          </Link>
          <span className="toolbar-link active">Library</span>
        </div>
        {tab === "cards" ? (
          <button className="toolbar-add" type="button" onClick={() => setAdding(true)} aria-label="Add practice item">
            <span className="toolbar-add-icon" aria-hidden="true">+</span>
            Add
          </button>
        ) : null}
      </div>

      <div className="library-tabs">
        <button
          className={`library-tab${tab === "cards" ? " active" : ""}`}
          type="button"
          onClick={() => setTab("cards")}
        >
          Practice cards
        </button>
        <button
          className={`library-tab${tab === "songs" ? " active" : ""}`}
          type="button"
          onClick={() => setTab("songs")}
        >
          Songs
        </button>
      </div>

      {tab === "cards" ? (
        <section className="card table-card">
          <div className="table-header">
            <strong>{items.length} items</strong>
            {message ? <span className="muted">{message}</span> : null}
          </div>

          <div className="table-list">
            {orderedItems.map((item) => (
              <article className="table-row" key={item.id}>
                <div className="table-main">
                  <strong>{item.title}</strong>
                  <span>
                    {item.songTitle}
                    {item.artist ? ` · ${item.artist}` : ""}
                  </span>
                </div>

                <div className="table-ref">{item.referenceText}</div>

                <div className="table-meta">
                  <span>{getDisplayBpm(item)} BPM</span>
                  <span>{item.targetBpm ? `Target ${item.targetBpm}` : "No target"}</span>
                  <span>{formatPracticeDate(item.lastPractisedAt)}</span>
                  <span>{item.archived ? "Archived" : "Active"}</span>
                </div>

                <div className="table-actions">
                  <div className="table-actions-group">
                    <button className="link-button" type="button" onClick={() => setEditingItem(item)}>
                      Edit
                    </button>
                    <button className="link-button" type="button" onClick={() => setCopyingItem(item)}>
                      Copy
                    </button>
                  </div>
                  <div className="table-actions-group">
                  <button
                    className="link-button danger"
                    type="button"
                    onClick={() =>
                      setConfirmState({
                        title: item.archived ? "Restore item?" : "Archive item?",
                        message: item.archived
                          ? "This will put the item back into the practice queue."
                          : "This removes the item from the queue but keeps it in the library.",
                        confirmLabel: item.archived ? "Restore" : "Archive",
                        tone: item.archived ? "default" : "danger",
                        onConfirm: () => {
                          void toggleArchive(item);
                          setConfirmState(null);
                        }
                      })
                    }
                  >
                    {item.archived ? "Restore" : "Archive"}
                  </button>
                  <button
                    className="link-button danger"
                    type="button"
                    onClick={() =>
                      setConfirmState({
                        title: "Delete item?",
                        message: `Permanently delete "${item.title}"? This also removes its tempo history and cannot be undone.`,
                        confirmLabel: "Delete",
                        tone: "danger",
                        onConfirm: () => {
                          void deleteItem(item);
                          setConfirmState(null);
                        }
                      })
                    }
                  >
                    Delete
                  </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="card table-card">
          <div className="table-header">
            <strong>{songs.length} songs</strong>
            {message ? <span className="muted">{message}</span> : null}
          </div>

          <div className="table-list">
            {songs.map((song) => (
              <article className="table-row" key={song.id}>
                <div className="table-main">
                  <strong>{song.title}</strong>
                  <span>{song.artist ?? <em className="muted">No artist</em>}</span>
                </div>

                <div className="table-meta">
                  {song.capo !== null ? <span>Capo {song.capo}</span> : <span className="muted">No capo</span>}
                  <span>{song.itemCount} {song.itemCount === 1 ? "card" : "cards"}</span>
                </div>

                <div className="table-actions">
                  <div className="table-actions-group">
                    <button className="link-button" type="button" onClick={() => setEditingSong(song)}>
                      Edit
                    </button>
                  </div>
                  {song.itemCount === 0 ? (
                    <div className="table-actions-group">
                      <button
                        className="link-button danger"
                        type="button"
                        onClick={() =>
                          setConfirmState({
                            title: "Delete song?",
                            message: `Permanently delete "${song.title}"? This song has no practice cards and cannot be undone.`,
                            confirmLabel: "Delete",
                            tone: "danger",
                            onConfirm: () => {
                              void deleteSong(song);
                              setConfirmState(null);
                            }
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <QuickAddSheet
        open={adding}
        title="Add a practice item"
        submitLabel="Create item"
        onClose={() => setAdding(false)}
        onSubmit={createItem}
      />

      <QuickAddSheet
        open={editingItem !== null}
        title="Edit practice item"
        submitLabel="Save changes"
        initialValues={
          editingItem
            ? {
                songTitle: editingItem.songTitle,
                artist: editingItem.artist ?? "",
                title: editingItem.title,
                referenceText: editingItem.referenceText,
                practiceNotes: editingItem.practiceNotes ?? "",
                targetBpm: editingItem.targetBpm
              }
            : undefined
        }
        onClose={() => setEditingItem(null)}
        onSubmit={saveEdit}
      />

      <QuickAddSheet
        open={copyingItem !== null}
        title="Copy practice item"
        submitLabel="Create copy"
        initialValues={
          copyingItem
            ? {
                songTitle: copyingItem.songTitle,
                artist: copyingItem.artist ?? "",
                title: "",
                referenceText: "",
                practiceNotes: "",
                targetBpm: copyingItem.targetBpm
              }
            : undefined
        }
        onClose={() => setCopyingItem(null)}
        onSubmit={copyItem}
      />

      <SongEditSheet
        open={editingSong !== null}
        song={editingSong}
        onClose={() => setEditingSong(null)}
        onSubmit={saveSongEdit}
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
    </>
  );
}
