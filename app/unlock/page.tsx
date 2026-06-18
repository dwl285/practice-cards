import { redirect } from "next/navigation";
import { unlockWithCode } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function UnlockPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next === "/library" ? "/library" : "/";

  async function unlock(formData: FormData) {
    "use server";

    const code = String(formData.get("code") ?? "");
    const requestedPath = String(formData.get("next") ?? "/");
    const safeNextPath = requestedPath === "/library" ? "/library" : "/";
    const ok = await unlockWithCode(code);

    if (!ok) {
      redirect(`/unlock?next=${encodeURIComponent(safeNextPath)}&error=1`);
    }

    redirect(safeNextPath);
  }

  return (
    <main className="shell">
      <div className="page stack">
        <section className="hero">
          <div className="hero-body">
            <span className="eyebrow">Private Practice</span>
            <h1 className="title">Unlock your queue.</h1>
            <p className="subtitle">
              This is a single-user practice tool. Enter the access code and the app will remember
              this device for a while.
            </p>
          </div>
        </section>

        <section className="card section">
          <form action={unlock} className="stack">
            <input type="hidden" name="next" value={nextPath} />
            <div className="field">
              <label htmlFor="code">Access code</label>
              <input id="code" name="code" type="password" autoFocus required />
            </div>
            {resolvedSearchParams.error ? <p className="error">That access code was not valid.</p> : null}
            <button className="button" type="submit">
              Enter
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
