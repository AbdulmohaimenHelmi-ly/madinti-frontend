import { type NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { KNOWN_SEGMENTS } from "@/lib/api/segments";

const secret = new TextEncoder().encode(
  process.env.PROXY_JWT_SECRET ||
    "dev-only-secret-please-set-PROXY_JWT_SECRET-in-production"
);

/** Generates a cryptographically random 8-character lowercase alias. */
function randomAlias(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// ── One-time nonce store ───────────────────────────────────────────────────────
// Nonces are consumed on first use and auto-expire after 3 min of inactivity.
// This is in-memory (single-instance) — enough for a VPS deployment.
const _usedNonces = new Set<string>();
const NONCE_TTL = 3 * 60 * 1000; // 3 minutes

function markNonceUsed(nonce: string) {
  _usedNonces.add(nonce);
  // Auto-clean after TTL so memory doesn't grow unbounded.
  setTimeout(() => _usedNonces.delete(nonce), NONCE_TTL);
}

export async function GET(req: NextRequest) {
  // ── 1. Validate signed page-load nonce ───────────────────────────────────
  // The nonce is generated server-side in the layout and embedded as
  // <meta name="x-pt">. The client reads it and sends it here.
  // Without a valid, fresh, unused nonce, /api/init refuses to respond.
  const pageToken = req.headers.get("x-page-token");
  if (!pageToken) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let nonce: string;
  try {
    const { payload } = await jwtVerify(pageToken, secret);
    nonce = (payload as { nonce: string }).nonce;
    if (!nonce) throw new Error("missing nonce");
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Reject replayed nonces — each page load gets exactly one init call.
  if (_usedNonces.has(nonce)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  markNonceUsed(nonce);

  // ── 2. Generate alias map ─────────────────────────────────────────────────
  const forwardMap: Record<string, string> = {};
  const reverseMap: Record<string, string> = {};

  for (const seg of KNOWN_SEGMENTS) {
    const alias = randomAlias();
    forwardMap[seg] = alias;
    reverseMap[alias] = seg;
  }

  const token = await new SignJWT({ map: reverseMap })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  const res = NextResponse.json({ map: forwardMap });

  res.cookies.set("__pt", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/api",
    maxAge: 86400,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
