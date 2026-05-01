import { NextResponse } from "next/server";
import { SignJWT } from "jose";
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

export async function GET() {
  // Forward map: real segment → alias  (returned to client, stored in memory)
  const forwardMap: Record<string, string> = {};
  // Reverse map: alias → real segment  (signed into JWT, never leaves server)
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

  // httpOnly: JS cannot read this cookie.
  // path "/api": only sent to /api/init and /api/p/* — not to page requests.
  res.cookies.set("__pt", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/api",
    maxAge: 86400,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
