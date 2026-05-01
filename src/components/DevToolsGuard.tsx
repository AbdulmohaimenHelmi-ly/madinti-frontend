"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function isInspectShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;

  if (key === "f12") return true;
  if (modifier && event.shiftKey && ["i", "j", "c"].includes(key)) return true;
  if (modifier && key === "u") return true;

  return false;
}

export default function DevToolsGuard({ locale }: { locale: string }) {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    const target = `/hacker?lang=${locale}`;
    redirected.current = false;

    function redirect() {
      if (redirected.current) return;
      redirected.current = true;
      router.replace(target);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isInspectShortcut(event)) return;
      event.preventDefault();
      redirect();
    }

    // Browsers do not expose a reliable "DevTools is open" API.
    // Only trap explicit inspect/view-source shortcuts to avoid false positives.
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [router, locale]);

  return null;
}
