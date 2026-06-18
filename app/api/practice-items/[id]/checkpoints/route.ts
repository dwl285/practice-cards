import { NextResponse } from "next/server";
import { saveTempoCheckpoint } from "@/lib/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const payload = await request.json();
  const bpm = Number(payload.bpm);

  if (!Number.isFinite(bpm) || bpm <= 0) {
    return NextResponse.json({ error: "BPM must be a positive number." }, { status: 400 });
  }

  const { id } = await context.params;
  const item = await saveTempoCheckpoint(id, Math.round(bpm));

  return NextResponse.json(item, { status: 201 });
}
