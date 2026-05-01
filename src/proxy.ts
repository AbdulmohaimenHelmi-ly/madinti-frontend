import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isbot } from "isbot";

const intlMiddleware = createMiddleware(routing);

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Bot fingerprint check for proxy routes ────────────────────────────────
  // Real browsers always attach `sec-fetch-site` to every fetch/XHR call.
  // Raw tools (curl, wget, Python requests, Node axios) do not.
  // Mobile app calls Laravel directly — it never hits this proxy.
  if (pathname.startsWith("/api/p/")) {
    const ua = req.headers.get("user-agent") ?? "";
    if (!req.headers.get("sec-fetch-site") || isbot(ua)) {
      return new NextResponse(null, { status: 403 });
    }
    return NextResponse.next();
  }

  // Block known bot UAs from the random init endpoint too.
  if (pathname.startsWith("/api/")) {
    const ua = req.headers.get("user-agent") ?? "";
    if (isbot(ua)) return new NextResponse(null, { status: 403 });
    return NextResponse.next();
  }

  // All other routes go through next-intl.
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Page routes (next-intl)
    "/",
    "/(ar|en)/:path*",
    // API routes
    "/api/:path*",
  ],
};

