import axios from "axios";

// ─── Proxy alias map ──────────────────────────────────────────────────────────
// The /api/init endpoint generates a fresh random alias per session.
// The server stores the reverse map (alias → real segment) in a signed httpOnly
// cookie.  We store only the forward map (real segment → alias) in memory so
// the real endpoint paths are NEVER visible in DevTools or the JS bundle.

let _forwardMap: Record<string, string> | null = null;
let _initPromise: Promise<void> | null = null;

async function _doInit(): Promise<void> {
  // Read the signed page-load nonce the server embedded in the HTML <head>.
  // Without it, /api/init returns 403 — raw bots that skip the HTML render
  // cannot obtain the alias map.
  const pageToken =
    typeof document !== "undefined"
      ? (document.querySelector('meta[name="x-pt"]')?.getAttribute("content") ?? "")
      : "";

  const res = await fetch("/api/init", {
    headers: pageToken ? { "x-page-token": pageToken } : {},
  });
  if (!res.ok) throw new Error("proxy init failed");
  const data = await res.json();
  _forwardMap = data.map as Record<string, string>;
}

function ensureInit(): Promise<void> {
  if (_forwardMap) return Promise.resolve();
  if (!_initPromise) {
    _initPromise = _doInit().catch((err) => {
      _initPromise = null; // allow retry on next request
      throw err;
    });
  }
  return _initPromise;
}

/**
 * Encodes a real API path into its aliased form.
 * e.g. "/products/featured" → "/api/p/<alias1>/<alias2>"
 * Numeric IDs pass through unchanged.
 */
function encodeApiPath(url: string, map: Record<string, string>): string {
  const segments = url.replace(/^\/+/, "").split("/");
  const encoded = segments.map((seg) =>
    /^\d+$/.test(seg) ? seg : (map[seg] ?? seg)
  );
  return "/api/p/" + encoded.join("/");
}

// ─── Axios client ─────────────────────────────────────────────────────────────
const apiClient = axios.create({
  // baseURL is intentionally empty — the request interceptor builds the full
  // path after the proxy alias map has been initialised.
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const locale = document.documentElement.lang || "ar";
    config.headers["Accept-Language"] = locale;

    // Anonymous session id — used by the backend's "For You" recommender
    // to personalise results for guests based on their browsing history.
    let sessionId = localStorage.getItem("ajjmal_session_id");
    if (!sessionId) {
      sessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("ajjmal_session_id", sessionId);
    }
    config.headers["X-Session-Id"] = sessionId;

    // Encode the real path through the proxy alias map.
    // Store the original URL so the response interceptor can re-encode on retry.
    await ensureInit();
    if (_forwardMap && config.url) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (config as unknown as Record<string, unknown>)._originalUrl = config.url;
      config.url = encodeApiPath(config.url, _forwardMap);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Proxy token expired (alias map rotated on server restart or after 24 h).
    // Re-init silently and retry the original request once.
    if (error.response?.headers?.["x-proxy-reinit"] === "1") {
      _forwardMap = null;
      _initPromise = null;
      try {
        await ensureInit();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = error.config as unknown as Record<string, unknown> & typeof error.config;
        const originalUrl = cfg._originalUrl as string | undefined;
        if (_forwardMap && originalUrl) {
          cfg.url = encodeApiPath(originalUrl, _forwardMap);
          return apiClient.request(cfg);
        }
      } catch {
        // fall through to normal error handling
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/ar/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
