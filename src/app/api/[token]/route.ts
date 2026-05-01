import { type NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { KNOWN_SEGMENTS } from "@/lib/api/segments";

const secret = new TextEncoder().encode(
  process.env.PROXY_JWT_SECRET ||
    "dev-only-secret-please-set-PROXY_JWT_SECRET-in-production"
);

// ── One-time nonce store ───────────────────────────────────────────────────────
const _usedNonces = new Set<string>();
function markNonceUsed(nonce: string) {
  _usedNonces.add(nonce);
  setTimeout(() => _usedNonces.delete(nonce), 3 * 60 * 1000);
}

/** Generates a cryptographically random 8-character lowercase alias. */
function randomAlias(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // ── 1. Verify the token is a valid signed JWT ─────────────────────────────
  // Return 404 (not 403) so the endpoint appears to simply not exist.
  let nonce: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    nonce = (payload as { n: string }).n;
    if (!nonce) throw new Error();
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  // ── 2. Reject replayed nonces ─────────────────────────────────────────────
  if (_usedNonces.has(nonce)) {
    return new NextResponse(null, { status: 404 });
  }

  // Consume nonce.
  markNonceUsed(nonce);

  // ── 3. Generate alias map ───────────────────────────────────────────────────
  const forwardMap: Record<string, string> = {};
  const reverseMap: Record<string, string> = {};

  for (const seg of KNOWN_SEGMENTS) {
    const alias = randomAlias();
    forwardMap[seg] = alias;
    reverseMap[alias] = seg;
  }

  const proxyToken = await new SignJWT({ map: reverseMap })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  const res = NextResponse.json({ map: forwardMap });

  res.cookies.set("__pt", proxyToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/api",
    maxAge: 86400,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
