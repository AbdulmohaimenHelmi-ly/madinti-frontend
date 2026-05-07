"use client";
import { useEffect } from "react";
import { useContentFilter } from "@/lib/context/ContentFilterContext";

export default function ThemeApplier() {
  const { filter } = useContentFilter();
  useEffect(() => {
    const theme = filter === "female" ? "female" : filter === "male" ? "male" : "neutral";
    document.documentElement.setAttribute("data-theme", theme);
    const backgrounds: Record<string, string> = {
      female: "#FFF7FA",
      male: "#F4F6F9",
      neutral: "#F5F7FA",
    };
    document.body.style.backgroundColor = backgrounds[theme] || "#F5F7FA";
  }, [filter]);
  return null;
}
