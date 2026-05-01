"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 100;

function isDevToolsOpen(): boolean {
  return (
    window.outerWidth - window.innerWidth > THRESHOLD ||
    window.outerHeight - window.innerHeight > THRESHOLD
  );
}

export default function DevToolsGuard({ locale }: { locale: string }) {
  const router = useRouter();
  // useRef so the flag resets every time the component mounts (i.e. every page load).
  const redirected = useRef(false);

  useEffect(() => {
    const target = `/hacker?lang=${locale}`;
    redirected.current = false;

    function check() {
      if (!redirected.current && isDevToolsOpen()) {
        redirected.current = true;
        router.replace(target);
      }
    }

    // Fire immediately + on every resize (docking/undocking DevTools triggers resize).
    check();
    window.addEventListener("resize", check);
    const interval = setInterval(check, 500);

    return () => {
      window.removeEventListener("resize", check);
      clearInterval(interval);
    };
  }, [router, locale]);

  return null;
}
