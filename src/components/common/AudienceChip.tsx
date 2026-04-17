"use client";

import { Chip } from "@mui/material";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import WcIcon from "@mui/icons-material/Wc";
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
  const Icon = v === "male" ? MaleIcon : v === "female" ? FemaleIcon : WcIcon;
  const color: "primary" | "secondary" | "default" =
    v === "female" ? "secondary" : v === "male" ? "primary" : "default";

  return (
    <Chip
      size={size}
      variant={variant}
      color={color}
      icon={<Icon sx={{ fontSize: 16 }} />}
      label={label}
      sx={{ fontWeight: 600 }}
    />
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
