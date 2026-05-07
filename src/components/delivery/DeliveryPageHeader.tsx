"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Home, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DeliveryPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
}

export default function DeliveryPageHeader({ title, subtitle, breadcrumb, action }: DeliveryPageHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("delivery");
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;

  return (
    <div className="mb-6">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
        <Link href={`/${locale}/delivery`} className="flex items-center gap-1 no-underline text-gray-500 hover:text-gray-800 transition">
          <Home size={14} /> {t("panel")}
        </Link>
        <Chevron size={14} className="text-gray-400" />
        <span className="font-semibold text-gray-800">{breadcrumb ?? title}</span>
      </nav>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold leading-tight text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && (
          action.href ? (
            <Link href={action.href} className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white no-underline transition", action.disabled ? "opacity-50 pointer-events-none" : "hover:opacity-90")} style={{ background: "var(--color-primary)" }}>
              {action.icon}{action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} disabled={action.disabled}
              className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition", action.disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90")}
              style={{ background: "var(--color-primary)" }}>
              {action.icon}{action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
