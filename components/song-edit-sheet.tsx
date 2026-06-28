"use client";

import { useEffect, useState } from "react";
import type { SongPayload, SongView } from "@/lib/types";

type SongEditSheetProps = {
  open: boolean;
  song: SongView | null;
  onClose: () => void;
  onSubmit: (id: string, payload: SongPayload) => Promise<void>;
};

export default function SongEditSheet({ open, song, onClose, onSubmit }: SongEditSheetProps) {
  const [artist, setArtist] = useState("");
  const [capo, setCapo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && song) {
      setArtist(song.artist ?? "");
      setCapo(song.capo);
      setSubmitting(false);
      setError(null);
    }
  }, [open, song]);

  if (!open || !song) {
    return null;
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="handle" />
        <div className="stack">
          <div className="row between">
            <div>
              <span className="eyebrow">Songs</span>
              <h2 style={{ margin: "6px 0 0" }}>Edit song</h2>
            </div>
            <button className="button secondary" type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="fieldset">
            <div className="field">
              <label>Song title</label>
              <input value={song.title} disabled style={{ opacity: 0.5 }} />
            </div>

            <div className="field">
              <label htmlFor="songArtist">Artist</label>
              <input
                id="songArtist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="songCapo">Capo position</label>
              <input
                id="songCapo"
                type="number"
                inputMode="numeric"
                min={0}
                max={11}
                placeholder="None"
                value={capo ?? ""}
                onChange={(e) =>
                  setCapo(e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button
            className="button save"
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (capo !== null && (capo < 0 || capo > 11)) {
                setError("Capo must be between 0 and 11.");
                return;
              }

              setSubmitting(true);
              setError(null);

              try {
                await onSubmit(song.id, {
                  artist: artist.trim() || null,
                  capo
                });
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Something went wrong while saving."
                );
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
