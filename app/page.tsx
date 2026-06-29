import { dayKey } from "@/lib/practice-noise";
import { getPracticeQueue } from "@/lib/repository";
import PracticeClient from "@/components/practice-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const queue = await getPracticeQueue();

  return <PracticeClient initialQueue={queue} daySeed={dayKey()} />;
}
