"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Threshold in pixels — DevTools docked to side/bottom takes at least this much space.
const THRESHOLD = 100;

let _redirected = false;

function isDevToolsOpen(): boolean {
  return (
    window.outerWidth - window.innerWidth > THRESHOLD ||
    window.outerHeight - window.innerHeight > THRESHOLD
  );
}

export default function DevToolsGuard({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    const target = `/hacker?lang=${locale}`;

    // Check immediately on mount (handles DevTools already open before page load).
    if (isDevToolsOpen()) {
      _redirected = true;
      router.replace(target);
      return;
    }

    const interval = setInterval(() => {
      if (!_redirected && isDevToolsOpen()) {
        _redirected = true;
        router.replace(target);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [router, locale]);

  return null;
}
