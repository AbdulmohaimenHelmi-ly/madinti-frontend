import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Works for single-instance deployments (VPS / local).
// Sliding window: MAX_REQUESTS per WINDOW_MS per IP.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 80;  // generous enough for normal app usage

const hitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (hitMap.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQUESTS) return true;
  hits.push(now);
  hitMap.set(ip, hits);
  return false;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Apply rate limiting to all proxy and init routes.
  if (pathname.startsWith("/api/p/") || pathname === "/api/init") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

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
    // API proxy routes (rate limiter)
    "/api/init",
    "/api/p/:path*",
  ],
};

