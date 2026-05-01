"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type DevToolsOrientation = "vertical" | "horizontal";

type DevToolsState = {
  isOpen: boolean;
  orientation?: DevToolsOrientation;
};

type FirebugWindow = Window & {
  Firebug?: {
    chrome?: {
      isInitialized?: boolean;
    };
  };
};

const DEVTOOLS_THRESHOLD = 170;
const DEVTOOLS_CHECK_INTERVAL_MS = 500;

function emitDevToolsChange(detail: DevToolsState) {
  window.dispatchEvent(new CustomEvent<DevToolsState>("devtoolschange", { detail }));
}

function detectDevTools(
  previousState: DevToolsState,
  emitEvents = true,
): DevToolsState {
  const widthThreshold = window.outerWidth - window.innerWidth > DEVTOOLS_THRESHOLD;
  const heightThreshold = window.outerHeight - window.innerHeight > DEVTOOLS_THRESHOLD;
  const firebugInitialized = Boolean(
    (window as FirebugWindow).Firebug?.chrome?.isInitialized,
  );
  const orientation: DevToolsOrientation = widthThreshold ? "vertical" : "horizontal";

  if (!(heightThreshold && widthThreshold) && (firebugInitialized || widthThreshold || heightThreshold)) {
    if (emitEvents && (!previousState.isOpen || previousState.orientation !== orientation)) {
      emitDevToolsChange({ isOpen: true, orientation });
    }

    return { isOpen: true, orientation };
  }

  if (emitEvents && previousState.isOpen) {
    emitDevToolsChange({ isOpen: false });
  }

  return { isOpen: false };
}

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
    let devToolsState: DevToolsState = detectDevTools({ isOpen: false }, false);

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

    function handleDevToolsChange(event: Event) {
      const detail = (event as CustomEvent<DevToolsState>).detail;
      if (detail?.isOpen) {
        redirect();
      }
    }

    if (devToolsState.isOpen) {
      redirect();
    }

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("devtoolschange", handleDevToolsChange as EventListener);

    const interval = window.setInterval(() => {
      devToolsState = detectDevTools(devToolsState, true);
    }, DEVTOOLS_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("devtoolschange", handleDevToolsChange as EventListener);
      window.clearInterval(interval);
    };
  }, [router, locale]);

  return null;
}
