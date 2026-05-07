"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslations } from "next-intl";

const WINDOW_MS   = 10_000;
const MAX_LOADS   = 4;
const COOLDOWN_MS = 30_000;
const LS_TIMESTAMPS = "_rl_ts";
const LS_COOLDOWN   = "_rl_cd";

function checkAndRecordLoad(): number | null {
  try {
    const now = Date.now();
    const storedExpiry = localStorage.getItem(LS_COOLDOWN);
    if (storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (expiry > now) return Math.ceil((expiry - now) / 1000);
      localStorage.removeItem(LS_COOLDOWN);
      localStorage.removeItem(LS_TIMESTAMPS);
    }
    const raw = localStorage.getItem(LS_TIMESTAMPS);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const recent = timestamps.filter((ts) => now - ts < WINDOW_MS);
    recent.push(now);
    localStorage.setItem(LS_TIMESTAMPS, JSON.stringify(recent));
    if (recent.length > MAX_LOADS) {
      const expiry = now + COOLDOWN_MS;
      localStorage.setItem(LS_COOLDOWN, String(expiry));
      return Math.ceil(COOLDOWN_MS / 1000);
    }
  } catch { /* localStorage unavailable */ }
  return null;
}

export default function RefreshGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("refreshGuard");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useLayoutEffect(() => {
    const secs = checkAndRecordLoad();
    if (secs !== null) setSecondsLeft(secs);
  }, []);

  useEffect(() => {
    function handlePopState() {
      const secs = checkAndRecordLoad();
      if (secs !== null) setSecondsLeft(secs);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          try { localStorage.removeItem(LS_COOLDOWN); localStorage.removeItem(LS_TIMESTAMPS); } catch { /* ignore */ }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  if (secondsLeft !== null) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{
          background: "rgba(10, 12, 22, 0.92)",
          backdropFilter: "blur(6px)",
          backgroundImage: "linear-gradient(rgba(251,182,206,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,182,206,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div className="relative bg-white/5 border border-[rgba(251,182,206,0.2)] rounded-3xl px-8 sm:px-16 py-10 sm:py-14 max-w-[460px] w-[90%] text-center shadow-2xl">
          <p className="text-5xl leading-none mb-4">🐢</p>
          <h2 className="text-xl font-bold text-[#fbb6ce] mb-3">{t("heading")}</h2>
          <p className="text-white/70 leading-relaxed mb-8">{t("body")}</p>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-[3px] border-[rgba(251,182,206,0.4)] bg-[rgba(251,182,206,0.08)]">
            <span className="text-4xl font-extrabold text-[#fbb6ce] tabular-nums">{secondsLeft}</span>
          </div>
          <p className="text-white/35 text-xs mt-3">{t("hint")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
