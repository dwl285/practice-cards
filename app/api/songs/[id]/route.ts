import { NextRequest, NextResponse } from "next/server";
import { updateSong } from "@/lib/repository";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: unknown = await request.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const artist = payload.artist !== undefined ? (payload.artist as string | null) : undefined;
  const capo =
    payload.capo !== undefined
      ? payload.capo === null
        ? null
        : Number(payload.capo)
      : undefined;

  if (capo !== undefined && capo !== null && (isNaN(capo) || capo < 0 || capo > 11)) {
    return NextResponse.json({ error: "Capo must be between 0 and 11." }, { status: 400 });
  }

  try {
    const song = await updateSong(id, { artist, capo });
    return NextResponse.json(song);
  } catch {
    return NextResponse.json({ error: "Could not update song." }, { status: 500 });
  }
}
