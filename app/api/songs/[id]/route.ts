import { NextRequest, NextResponse } from "next/server";
import { deleteSong, SongHasItemsError, updateSong } from "@/lib/repository";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: unknown = await request.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const title = payload.title !== undefined ? String(payload.title) : undefined;
  const artist = payload.artist !== undefined ? (payload.artist as string | null) : undefined;
  const capo =
    payload.capo !== undefined
      ? payload.capo === null
        ? null
        : Number(payload.capo)
      : undefined;

  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "Song title cannot be empty." }, { status: 400 });
  }

  if (capo !== undefined && capo !== null && (isNaN(capo) || capo < 0 || capo > 11)) {
    return NextResponse.json({ error: "Capo must be between 0 and 11." }, { status: 400 });
  }

  try {
    const song = await updateSong(id, { title, artist, capo });
    return NextResponse.json(song);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Another song already has that title and artist." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Could not update song." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteSong(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SongHasItemsError) {
      return NextResponse.json(
        { error: "Can't delete a song that still has practice cards." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Could not delete song." }, { status: 500 });
  }
}
