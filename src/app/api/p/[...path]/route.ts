import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createHmac } from "crypto";

const secret = new TextEncoder().encode(
  process.env.PROXY_JWT_SECRET ||
    "dev-only-secret-please-set-PROXY_JWT_SECRET-in-production"
);

const BACKEND = (
  process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

const PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET ?? "";

/** Generate an X-Proxy-Sig header value: "{timestamp}.{hmac}" */
function makeProxySig(): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHmac("sha256", PROXY_SECRET).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

// Headers we pass through to Laravel (never the cookie — that's internal).
const PASSTHROUGH_HEADERS = new Set([
  "authorization",
  "accept",
  "accept-language",
  "content-type",
  "x-session-id",
]);

async function handle(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // ── 1. Read JWT from httpOnly cookie ─────────────────────────────────────
  const token = req.cookies.get("__pt")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "x-proxy-reinit": "1" },
    });
  }

  // ── 2. Verify + decode JWT ────────────────────────────────────────────────
  let reverseMap: Record<string, string>;
  try {
    const { payload } = await jwtVerify(token, secret);
    reverseMap = (payload as { map: Record<string, string> }).map;
  } catch {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "x-proxy-reinit": "1" },
    });
  }

  // ── 3. Decode path (alias → real segment, numeric IDs pass through) ───────
  const { path } = await context.params;
  const realSegments = path.map((seg) =>
    /^\d+$/.test(seg) ? seg : (reverseMap[seg] ?? seg)
  );
  const realPath = realSegments.join("/");

  // ── 4. Build target URL (preserve query string) ───────────────────────────
  const incoming = new URL(req.url);
  const targetUrl = `${BACKEND}/api/v1/${realPath}${incoming.search}`;

  // ── 5. Forward safe headers only ─────────────────────────────────────────
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (PASSTHROUGH_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // Authenticate this server-to-server request so Laravel can verify the
  // request came from our trusted proxy and not from a direct API caller.
  headers.set("X-Proxy-Sig", makeProxySig());

  // ── 6. Read body (supports JSON, FormData, binary uploads) ───────────────
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  // ── 7. Proxy to Laravel ───────────────────────────────────────────────────
  let laravelRes: Response;
  try {
    laravelRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
    });
  } catch (err) {
    console.error("[proxy] backend unreachable:", err);
    return new NextResponse("Bad Gateway", { status: 502 });
  }

  // ── 8. Stream response back ───────────────────────────────────────────────
  const resHeaders = new Headers();
  const ct = laravelRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  return new NextResponse(laravelRes.body, {
    status: laravelRes.status,
    headers: resHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
