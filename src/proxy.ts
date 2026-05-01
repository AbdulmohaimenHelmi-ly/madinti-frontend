import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Covers /api/p/* (the proxy calls) — 80 per IP per minute.
// /api/[token] (the random init endpoint) has its own limiter inside the route.
const API_WINDOW_MS = 60_000;
const API_MAX = 80;

const apiHits = new Map<string, number[]>();

function isLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (apiHits.get(ip) ?? []).filter((t) => now - t < API_WINDOW_MS);
  if (hits.length >= API_MAX) return true;
  hits.push(now);
  apiHits.set(ip, hits);
  return false;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate-limit the proxy routes only.
  if (pathname.startsWith("/api/p/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isLimited(ip)) {
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
    // Proxy routes (rate limiter)
    "/api/p/:path*",
  ],
};

