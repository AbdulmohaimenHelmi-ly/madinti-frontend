"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ── Tunable constants ────────────────────────────────────────────────────────
const WINDOW_MS   = 10_000;  // sliding window to count reloads in
const MAX_LOADS   = 4;       // max reloads allowed inside the window
const COOLDOWN_MS = 30_000;  // lockout duration after exceeding the limit

const LS_TIMESTAMPS = "_rl_ts";
const LS_COOLDOWN   = "_rl_cd";
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the initial cooldown seconds from localStorage.
 * This runs exclusively on the client (imported with ssr:false).
 * Returns null if no cooldown is active.
 */
function computeInitialSeconds(): number | null {
  try {
    const now = Date.now();

    // ── Check existing cooldown ───────────────────────────────────────────
    const storedExpiry = localStorage.getItem(LS_COOLDOWN);
    if (storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (expiry > now) {
        return Math.ceil((expiry - now) / 1000);
      }
      // Expired — clean up
      localStorage.removeItem(LS_COOLDOWN);
      localStorage.removeItem(LS_TIMESTAMPS);
    }

    // ── Record this page load ─────────────────────────────────────────────
    const raw = localStorage.getItem(LS_TIMESTAMPS);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Keep only timestamps inside the current window
    const recent = timestamps.filter((ts) => now - ts < WINDOW_MS);
    recent.push(now);
    localStorage.setItem(LS_TIMESTAMPS, JSON.stringify(recent));

    if (recent.length > MAX_LOADS) {
      const expiry = now + COOLDOWN_MS;
      localStorage.setItem(LS_COOLDOWN, String(expiry));
      return Math.ceil(COOLDOWN_MS / 1000);
    }
  } catch {
    // localStorage not available (private mode, etc.) — fail silently
  }
  return null;
}

export default function RefreshGuard() {
  const t = useTranslations("refreshGuard");
  // Lazy initializer runs once on the client at mount (no SSR because
  // this component is loaded via dynamic(..., { ssr: false })).
  const [secondsLeft, setSecondsLeft] = useState<number | null>(computeInitialSeconds);

  // ── Tick the countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          try {
            localStorage.removeItem(LS_COOLDOWN);
            localStorage.removeItem(LS_TIMESTAMPS);
          } catch {
            // ignore
          }
          return null; // dismiss overlay
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (secondsLeft === null) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 12, 22, 0.92)",
        backdropFilter: "blur(6px)",
        // Animated subtle grid (matches the hacker page aesthetic)
        "&::before": {
          content: '""',
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(251, 182, 206, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 182, 206, 0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(251, 182, 206, 0.2)",
          borderRadius: "24px",
          px: { xs: 4, sm: 8 },
          py: { xs: 5, sm: 7 },
          maxWidth: 460,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Emoji */}
        <Typography fontSize={56} lineHeight={1} mb={2}>
          🐢
        </Typography>

        {/* Heading */}
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: "#fbb6ce", mb: 1.5 }}
        >
          {t("heading")}
        </Typography>

        {/* Body */}
        <Typography
          variant="body1"
          sx={{ color: "rgba(255,255,255,0.7)", mb: 4, lineHeight: 1.7 }}
        >
          {t("body")}
        </Typography>

        {/* Countdown */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "3px solid rgba(251,182,206,0.4)",
            background: "rgba(251,182,206,0.08)",
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{ color: "#fbb6ce", fontVariantNumeric: "tabular-nums" }}
          >
            {secondsLeft}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{ display: "block", color: "rgba(255,255,255,0.35)", mt: 2 }}
        >
          {t("hint")}
        </Typography>
      </Box>
    </Box>
  );
}
