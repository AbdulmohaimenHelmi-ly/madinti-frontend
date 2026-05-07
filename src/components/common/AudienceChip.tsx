"use client";

import { Venus, Mars, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentType } from "@/lib/types";

interface AudienceChipProps {
  value?: ContentType | null;
  size?: "small" | "medium";
  variant?: "filled" | "outlined";
}

export default function AudienceChip({
  value,
  size = "small",
  variant = "filled",
}: AudienceChipProps) {
  const t = useTranslations("content");
  const v: ContentType = value ?? "unisex";
  const label = v === "male" ? t("male") : v === "female" ? t("female") : t("unisex");
  const Icon = v === "male" ? Mars : v === "female" ? Venus : Users;

  const colorClass =
    v === "female"
      ? variant === "filled"
        ? "bg-pink-100 text-pink-700 border-pink-200"
        : "border border-pink-400 text-pink-700"
      : v === "male"
        ? variant === "filled"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "border border-blue-400 text-blue-700"
        : variant === "filled"
          ? "bg-gray-100 text-gray-700 border-gray-200"
          : "border border-gray-400 text-gray-700";

  const sizeClass = size === "small" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${colorClass} ${sizeClass}`}>
      <Icon size={size === "small" ? 12 : 14} />
      {label}
    </span>
  );
}

export function useAudienceOptions(includeAll = true) {
  const t = useTranslations("content");
  const opts: { value: string; label: string }[] = [];
  if (includeAll) opts.push({ value: "", label: t("all") });
  opts.push({ value: "female", label: t("female") });
  opts.push({ value: "male", label: t("male") });
  opts.push({ value: "unisex", label: t("unisex") });
  return opts;
}
