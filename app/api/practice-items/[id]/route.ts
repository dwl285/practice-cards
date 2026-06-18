import { NextResponse } from "next/server";
import { archivePracticeItem, updatePracticeItem } from "@/lib/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseOptionalInt(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();

  if (typeof payload.archived === "boolean") {
    const item = await archivePracticeItem(id, payload.archived);
    return NextResponse.json(item);
  }

  if (
    typeof payload.songTitle !== "string" ||
    typeof payload.title !== "string" ||
    typeof payload.referenceText !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const item = await updatePracticeItem(id, {
    songTitle: payload.songTitle,
    artist: payload.artist,
    title: payload.title,
    referenceText: payload.referenceText,
    practiceNotes: payload.practiceNotes,
    targetBpm: parseOptionalInt(payload.targetBpm)
  });

  return NextResponse.json(item);
}
