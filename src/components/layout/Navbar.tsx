"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CategoriesMegaMenu from "./CategoriesMegaMenu";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "products", path: "/products" },
  { key: "vendors", path: "/vendors" },
] as const;

export default function Navbar() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    if (path === "") return pathname === `/${locale}` || pathname === `/${locale}/`;
    return pathname.startsWith(fullPath);
  };

  return (
    <nav className="hidden md:flex items-center gap-1 ms-4 px-2 py-1.5 rounded-full bg-[#F5F0F2] border border-[#EDE7E9]">
      <CategoriesMegaMenu />
      {navItems.map((item) => (
        <Link
          key={item.key}
          href={`/${locale}${item.path}`}
          className={cn(
            "rounded-full px-4 py-1.5 text-[0.875rem] text-[#1A1A1A] no-underline transition-all duration-200",
            isActive(item.path)
              ? "bg-white font-bold shadow-sm"
              : "font-medium hover:bg-white/55"
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
