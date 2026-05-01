"use client";

import { useEffect, useRef } from "react";
import devtools, { type DevToolsState } from "@/lib/devtoolsDetect";

export default function DevToolsGuard({ locale }: { locale: string }) {
  const redirected = useRef(false);

  useEffect(() => {
    const target = `/hacker?lang=${locale}`;
    redirected.current = false;

    function redirect() {
      if (redirected.current) return;
      redirected.current = true;
      window.location.replace(target);
    }

    function handleDevToolsChange(event: Event) {
      const detail = (event as CustomEvent<DevToolsState>).detail;
      if (detail?.isOpen) {
        redirect();
      }
    }

    if (devtools.isOpen) {
      redirect();
    }

    window.addEventListener("devtoolschange", handleDevToolsChange as EventListener);

    return () => {
      window.removeEventListener("devtoolschange", handleDevToolsChange as EventListener);
    };
  }, [locale]);

  return null;
}
