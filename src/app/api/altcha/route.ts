import { NextResponse } from "next/server";
import { createChallenge, verifySolution } from "altcha-lib/v1";

const HMAC_KEY =
  process.env.ALTCHA_HMAC_KEY || "dev-altcha-key-set-ALTCHA_HMAC_KEY-in-prod";

// GET — browser fetches a fresh PoW challenge
export async function GET() {
  const challenge = await createChallenge({
    hmacKey: HMAC_KEY,
    maxNumber: 50_000, // ~1-2s on a modern CPU — invisible to user
    expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
  });
  return NextResponse.json(challenge);
}

// POST — verify the solution the widget computed
export async function POST(req: Request) {
  try {
    const { payload } = (await req.json()) as { payload?: string };
    if (!payload) return NextResponse.json({ ok: false }, { status: 400 });

    const ok = await verifySolution(payload, HMAC_KEY, true);
    if (!ok) return NextResponse.json({ ok: false }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
