import { listPracticeItems, listSongs } from "@/lib/repository";
import LibraryClient from "@/components/library-client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const [items, songs] = await Promise.all([listPracticeItems(true), listSongs()]);

  return (
    <main className="shell">
      <div className="page stack">
        <LibraryClient initialItems={items} initialSongs={songs} />
      </div>
    </main>
  );
}
