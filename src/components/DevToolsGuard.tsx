"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type DevToolsChangeDetail = {
  isOpen: boolean;
  orientation?: "vertical" | "horizontal";
};

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
    let cancelled = false;
    let removeDevToolsListener: (() => void) | undefined;

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

    async function startDevToolsDetection() {
      try {
        const { default: devtools } = await import("devtools-detect");
        if (cancelled) return;

        const handleDevToolsChange = (event: Event) => {
          const detail = (event as CustomEvent<DevToolsChangeDetail>).detail;
          if (detail?.isOpen) redirect();
        };

        if (devtools.isOpen) {
          redirect();
        }

        window.addEventListener("devtoolschange", handleDevToolsChange as EventListener);
        removeDevToolsListener = () => {
          window.removeEventListener("devtoolschange", handleDevToolsChange as EventListener);
        };
      } catch {
        // Ignore detector load failures and fall back to shortcut trapping only.
      }
    }

    // There is no reliable browser API for DevTools state.
    // Use devtools-detect for docked tools and keep shortcut trapping as fallback.
    window.addEventListener("keydown", handleKeyDown, true);
    void startDevToolsDetection();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown, true);
      removeDevToolsListener?.();
    };
  }, [router, locale]);

  return null;
}
