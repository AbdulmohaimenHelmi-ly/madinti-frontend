import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Works for single-instance deployments (VPS / local).
// Two tiers:
//   /api/init  — 3 per IP per hour  (each page load gets exactly 1 init call)
//   /api/p/*   — 80 per IP per minute (normal browsing headroom)

const INIT_WINDOW_MS = 60 * 60_000; // 1 hour
const INIT_MAX = 3;
const API_WINDOW_MS = 60_000;       // 1 minute
const API_MAX = 80;

const initHits = new Map<string, number[]>();
const apiHits  = new Map<string, number[]>();

function isLimited(map: Map<string, number[]>, ip: string, window: number, max: number): boolean {
  const now = Date.now();
  const hits = (map.get(ip) ?? []).filter((t) => now - t < window);
  if (hits.length >= max) return true;
  hits.push(now);
  map.set(ip, hits);
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

    const limited =
      pathname === "/api/init"
        ? isLimited(initHits, ip, INIT_WINDOW_MS, INIT_MAX)
        : isLimited(apiHits,  ip, API_WINDOW_MS,  API_MAX);

    if (limited) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": pathname === "/api/init" ? "3600" : "60" },
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

