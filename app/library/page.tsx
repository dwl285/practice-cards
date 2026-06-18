import { listPracticeItems } from "@/lib/repository";
import LibraryClient from "@/components/library-client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const items = await listPracticeItems(true);

  return (
    <main className="shell">
      <div className="page stack">
        <LibraryClient initialItems={items} />
      </div>
    </main>
  );
}
