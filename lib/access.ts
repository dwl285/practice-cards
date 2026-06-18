import { cookies } from "next/headers";

export const ACCESS_COOKIE = "practice-access";
let expectedAccessHashPromise: Promise<string> | null = null;

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function unlockWithCode(code: string) {
  const configuredCode = process.env.ACCESS_CODE;

  if (!configuredCode || code !== configuredCode) {
    return false;
  }

  const store = await cookies();
  expectedAccessHashPromise ??= digest(configuredCode);
  store.set(ACCESS_COOKIE, await expectedAccessHashPromise, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/"
  });

  return true;
}

export async function clearAccessCookie() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
}
