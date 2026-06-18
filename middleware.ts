import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "practice-access";
let expectedAccessHashPromise: Promise<string> | null = null;

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;

  if (!accessCode) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isUnlockRoute = pathname === "/unlock";
  const isAssetRoute =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon");

  if (isAssetRoute) {
    return NextResponse.next();
  }

  expectedAccessHashPromise ??= digest(accessCode);
  const expected = await expectedAccessHashPromise;
  const actual = request.cookies.get(ACCESS_COOKIE)?.value;

  if (actual === expected) {
    if (isUnlockRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (isUnlockRoute) {
    return NextResponse.next();
  }

  const unlockUrl = new URL("/unlock", request.url);
  unlockUrl.searchParams.set("next", pathname === "/" ? "/" : pathname);
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/((?!api/access).*)"]
};
