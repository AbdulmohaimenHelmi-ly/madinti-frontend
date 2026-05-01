import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Bot fingerprint check for proxy routes ────────────────────────────────
  // Real browsers always attach `sec-fetch-site` to every fetch/XHR call.
  // Raw tools (curl, wget, Python requests, Node axios) do not.
  // Mobile app calls Laravel directly — it never hits this proxy.
  if (pathname.startsWith("/api/p/")) {
    if (!req.headers.get("sec-fetch-site")) {
      return new NextResponse(null, { status: 403 });
    }
    return NextResponse.next();
  }

  // Let other /api/* routes (e.g. /api/[token]) pass through unmodified.
  if (pathname.startsWith("/api/")) {
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

