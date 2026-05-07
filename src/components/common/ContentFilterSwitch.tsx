"use client";

import { Infinity, Venus, Mars } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContentFilter, type ContentFilter } from "@/lib/context/ContentFilterContext";
import { cn } from "@/lib/utils";

export default function ContentFilterSwitch({
  size = "medium",
}: {
  size?: "small" | "medium" | "large";
  sx?: object;
}) {
  const { filter, setFilter } = useContentFilter();
  const t = useTranslations("content");

  const options: { value: ContentFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: t("all"), icon: <Infinity size={size === "small" ? 14 : 16} /> },
    { value: "female", label: t("female"), icon: <Venus size={size === "small" ? 14 : 16} /> },
    { value: "male", label: t("male"), icon: <Mars size={size === "small" ? 14 : 16} /> },
  ];

  const btnPy = size === "small" ? "py-1 px-3 text-xs" : "py-2 px-4 text-sm";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white shadow-md p-1.5">
      {options.map((opt) => {
        const active = filter === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-200",
              btnPy,
              active
                ? "text-white shadow"
                : "text-gray-500 hover:text-gray-800"
            )}
            style={active ? { backgroundColor: "var(--color-primary)" } : {}}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
