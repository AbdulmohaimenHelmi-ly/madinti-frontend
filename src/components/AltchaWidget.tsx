"use client";

import { useEffect, useRef } from "react";

interface AltchaWidgetProps {
  /** Called with the base64 solution payload once the widget solves the PoW. */
  onSolve: (payload: string) => void;
}

export default function AltchaWidget({ onSolve }: AltchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSolveRef = useRef(onSolve);
  onSolveRef.current = onSolve;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let widget: HTMLElement;

    // Dynamically load the web component, then mount it imperatively.
    import("altcha").then(() => {
      // Guard against React Strict Mode double-invoke: don't add a second widget.
      if (container.querySelector("altcha-widget")) return;

      widget = document.createElement("altcha-widget");
      widget.setAttribute("challengeurl", "/api/altcha");
      widget.setAttribute("name", "altcha");
      widget.setAttribute("hidefooter", "true");
      widget.style.width = "100%";
      widget.style.setProperty("--altcha-color-base", "transparent");
      widget.style.setProperty("--altcha-color-border", "rgba(0,0,0,0.23)");
      widget.style.setProperty("--altcha-color-border-focus", "#1976d2");
      widget.style.setProperty("--altcha-color-text", "inherit");
      widget.style.setProperty("--altcha-color-footer-bg", "transparent");

      widget.addEventListener("statechange", (e: Event) => {
        const detail = (e as CustomEvent<{ state: string; payload?: string }>)
          .detail;
        if (detail.state === "verified" && detail.payload) {
          onSolveRef.current(detail.payload);
        }
      });

      container.appendChild(widget);
    });

    return () => {
      if (widget && container.contains(widget)) container.removeChild(widget);
    };
  }, []); // mount once

  return <div ref={containerRef} />;
}
