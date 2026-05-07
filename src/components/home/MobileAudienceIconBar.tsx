"use client";

import { useTranslations } from "next-intl";
import { Venus, Mars, Users } from "lucide-react";
import { useContentFilter, type ContentFilter } from "@/lib/context/ContentFilterContext";
import { cn } from "@/lib/utils";

const SEGMENTS: { key: ContentFilter; Icon: React.ElementType; labelKey: string }[] = [
  { key: "female", Icon: Venus, labelKey: "female" },
  { key: "male", Icon: Mars, labelKey: "male" },
  { key: "all", Icon: Users, labelKey: "all" },
];

export default function MobileAudienceIconBar() {
  const { filter, setFilter } = useContentFilter();
  const t = useTranslations("content");

  return (
    <div className="flex items-center bg-[#F5F0F2] border border-[#EDE7E9] rounded-full p-[3px] h-10">
      {SEGMENTS.map(({ key, Icon, labelKey }) => {
        const active = key === filter;
        return (
          <button
            key={key}
            type="button"
            role="button"
            aria-label={t(labelKey)}
            aria-pressed={active}
            onClick={() => setFilter(key)}
            title={t(labelKey)}
            className={cn(
              "w-[42px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-[220ms]",
              active ? "shadow-[0_4px_10px_rgba(0,0,0,0.18)]" : ""
            )}
            style={active ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" } : {}}
          >
            <Icon
              size={19}
              className={cn("transition-colors duration-[220ms]", active ? "text-white" : "text-[#6B6B6B]")}
            />
          </button>
        );
      })}
    </div>
  );
}
