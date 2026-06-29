"use client";

import { useState } from "react";
import type { PracticeItemPayload, PracticeItemView } from "@/lib/types";

type QuickAddSheetProps = {
  open: boolean;
  title: string;
  initialValues?: PracticeItemPayload;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (payload: PracticeItemPayload) => Promise<void>;
};

const emptyPayload: PracticeItemPayload = {
  songTitle: "",
  title: "",
  referenceText: "",
  artist: "",
  practiceNotes: "",
  targetBpm: null
};

export default function QuickAddSheet({
  open,
  title,
  initialValues,
  submitLabel,
  onClose,
  onSubmit
}: QuickAddSheetProps) {
  const [form, setForm] = useState<PracticeItemPayload>(initialValues ?? emptyPayload);
  const [showExtras, setShowExtras] = useState(Boolean(initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Seed the form during render (not in a post-paint effect) the moment the
  // sheet opens. An Edit/Copy sheet is already mounted with an empty form, so
  // resetting after paint made it flash empty for a frame before filling in.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initialValues ?? emptyPayload);
      setShowExtras(Boolean(initialValues));
      setSubmitting(false);
      setError(null);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="handle" />
        <div className="stack">
          <div className="row between">
            <div>
              <span className="eyebrow">Quick Add</span>
              <h2 style={{ margin: "6px 0 0" }}>{title}</h2>
            </div>
            <button className="button secondary" type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="fieldset">
            <div className="field">
              <label htmlFor="songTitle">Song title</label>
              <input
                id="songTitle"
                value={form.songTitle}
                onChange={(event) => setForm((current) => ({ ...current, songTitle: event.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="itemTitle">Practice item title</label>
              <input
                id="itemTitle"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="referenceText">Practice item description</label>
              <textarea
                id="referenceText"
                value={form.referenceText}
                onChange={(event) =>
                  setForm((current) => ({ ...current, referenceText: event.target.value }))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="targetBpm">Target BPM</label>
              <input
                id="targetBpm"
                type="number"
                inputMode="numeric"
                value={form.targetBpm ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetBpm: event.target.value ? Number(event.target.value) : null
                  }))
                }
              />
            </div>

            <button
              className="expand"
              type="button"
              onClick={() => setShowExtras((current) => !current)}
            >
              {showExtras ? "Hide additional fields" : "Show additional fields"}
            </button>

            {showExtras ? (
              <>
                <div className="field">
                  <label htmlFor="artist">Artist</label>
                  <input
                    id="artist"
                    value={form.artist ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, artist: event.target.value }))
                    }
                  />
                </div>

                <div className="field">
                  <label htmlFor="practiceNotes">Practice notes</label>
                  <textarea
                    id="practiceNotes"
                    value={form.practiceNotes ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, practiceNotes: event.target.value }))
                    }
                  />
                </div>
              </>
            ) : null}
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button
            className="button save"
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (!form.songTitle.trim() || !form.title.trim() || !form.referenceText.trim()) {
                setError("Song, practice item title, and reference text are required.");
                return;
              }

              setSubmitting(true);
              setError(null);

              try {
                await onSubmit(form);
              } catch (submissionError) {
                setError(
                  submissionError instanceof Error
                    ? submissionError.message
                    : "Something went wrong while saving."
                );
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
