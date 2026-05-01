"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Threshold in pixels — DevTools docked to side/bottom takes at least this much space.
const THRESHOLD = 160;

let _redirected = false;

function isDevToolsOpen(): boolean {
  return (
    window.outerWidth - window.innerWidth > THRESHOLD ||
    window.outerHeight - window.innerHeight > THRESHOLD
  );
}

export default function DevToolsGuard() {
  const router = useRouter();

  useEffect(() => {
    // Check immediately on mount (handles DevTools already open before page load).
    if (isDevToolsOpen()) {
      _redirected = true;
      router.replace("/hacker");
      return;
    }

    const interval = setInterval(() => {
      if (!_redirected && isDevToolsOpen()) {
        _redirected = true;
        router.replace("/hacker");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
