import { NextResponse } from "next/server";
import { createPracticeItem } from "@/lib/repository";

function parseOptionalInt(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value);
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (
    typeof payload.songTitle !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.referenceText !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const item = await createPracticeItem({
    songTitle: payload.songTitle,
    artist: payload.artist,
    title: payload.title,
    referenceText: payload.referenceText,
    practiceNotes: payload.practiceNotes,
    targetBpm: parseOptionalInt(payload.targetBpm)
  });

  return NextResponse.json(item, { status: 201 });
}
