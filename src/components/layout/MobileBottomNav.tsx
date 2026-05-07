"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Store, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";

const TABS = [
  {
    key: "home",
    path: "",
    labelKey: "home",
    Icon: Home,
    match: (p: string, locale: string) => p === `/${locale}` || p === `/${locale}/`,
  },
  {
    key: "categories",
    path: "/categories",
    labelKey: "categories",
    Icon: LayoutGrid,
    match: (p: string, locale: string) => p.startsWith(`/${locale}/categories`),
  },
  {
    key: "cart",
    path: "/cart",
    labelKey: "cart",
    Icon: ShoppingBag,
    match: (p: string, locale: string) =>
      p.startsWith(`/${locale}/cart`) || p.startsWith(`/${locale}/checkout`),
    badge: true,
  },
  {
    key: "vendors",
    path: "/vendors",
    labelKey: "vendors",
    Icon: Store,
    match: (p: string, locale: string) => p.startsWith(`/${locale}/vendors`),
  },
  {
    key: "profile",
    path: null,
    labelKey: "myProfile",
    Icon: User,
    match: (p: string, locale: string) =>
      p.startsWith(`/${locale}/profile`) ||
      p.startsWith(`/${locale}/orders`) ||
      p.startsWith(`/${locale}/favorites`) ||
      p.startsWith(`/${locale}/auth`),
  },
] satisfies Array<{
  key: string;
  path: string | null;
  labelKey: string;
  Icon: React.ElementType;
  match: (p: string, locale: string) => boolean;
  badge?: boolean;
}>;

export default function MobileBottomNav() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`) ||
    pathname?.startsWith(`/${locale}/delivery`)
  ) return null;

  const currentPath = pathname ?? "";

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 start-0 end-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className={`grid h-16`} style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
        {TABS.map(({ key, path, labelKey, Icon, match, badge }) => {
          const href =
            key === "profile"
              ? isAuthenticated ? `/${locale}/profile` : `/${locale}/auth/login`
              : `/${locale}${path}`;
          const active = match(currentPath, locale);
          const count = badge ? itemCount : 0;

          return (
            <Link
              key={key}
              href={href}
              prefetch={false}
              aria-label={t(labelKey)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 no-underline transition-all active:scale-95",
                active ? "text-[var(--color-primary)]" : "text-gray-500"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 w-7 h-[3px] rounded-b-[4px] bg-[var(--color-primary)]"
                />
              )}
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-orange-500 px-0.5 text-[0.6rem] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className={cn("text-[0.68rem] leading-tight truncate max-w-full px-1", active ? "font-bold" : "font-medium")}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
