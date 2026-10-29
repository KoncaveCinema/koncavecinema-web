import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";

/** Equal-time comparison, so response timing never hints at how much of a guess was right. */
function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Staging's password gate: with STAGING_PASSWORD set (staging only), every request needs it
 * through the browser's built-in sign-in box (HTTP Basic auth, any username). Without it, as on
 * production, every request passes straight through.
 */
export function proxy(request: NextRequest) {
  const password = env.STAGING_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (matches(given, password)) return NextResponse.next();
  }

  return new NextResponse("This preview of Koncave Cinema is private.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Koncave Cinema staging", charset="UTF-8"',
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  // Every page and asset; the browser resends the password with each request automatically
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
