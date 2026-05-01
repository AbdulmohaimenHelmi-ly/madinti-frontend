import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let /api/* routes pass through to their handlers.
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

