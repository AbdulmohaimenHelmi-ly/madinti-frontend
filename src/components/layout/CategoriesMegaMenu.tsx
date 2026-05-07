"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { ChevronDown, Layers } from "lucide-react";
import type { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";
import { cn } from "@/lib/utils";

export default function CategoriesMegaMenu() {
  const t = useTranslations("common");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const active = pathname.startsWith(`/${locale}/categories`);

  useEffect(() => {
    categoriesApi.getTree().then((res) => {
      const data = res.data.data ?? [];
      setTree(data);
      if (data.length > 0) setActiveId(data[0].id);
    }).catch(() => setTree([]));
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  const handleOpen = () => { cancelClose(); setOpen(true); };

  const name = (c: Category) => locale === "en" && c.name_en ? c.name_en : c.name;
  const activeNode = tree.find((c) => c.id === activeId) ?? tree[0] ?? null;
  const children = activeNode?.children ?? [];

  return (
    <div className="relative" onMouseEnter={handleOpen} onMouseLeave={scheduleClose}>
      <Link
        href={`/${locale}/categories`}
        onFocus={handleOpen}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-[0.875rem] text-[#1A1A1A] no-underline transition-all duration-200",
          active ? "bg-white font-bold shadow-sm" : "font-medium hover:bg-white/55"
        )}
      >
        {t("categories")}
        <ChevronDown
          size={14}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </Link>

      {open && tree.length > 0 && (
        <div
          className="absolute start-0 top-full z-50 mt-2"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="flex rounded-2xl shadow-2xl overflow-hidden border border-gray-100 bg-white"
            style={{ width: "min(880px, calc(100vw - 32px))" }}>
            {/* Left: parent categories */}
            <div className="w-[220px] shrink-0 border-e border-gray-100 bg-gray-50 py-2 max-h-[420px] overflow-y-auto">
              {tree.map((c) => {
                const isActive = c.id === activeNode?.id;
                return (
                  <Link
                    key={c.id}
                    href={`/${locale}/products?category_id=${c.id}`}
                    onMouseEnter={() => setActiveId(c.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm no-underline border-s-[3px] transition-all duration-150",
                      isActive
                        ? "bg-white font-bold border-s-[var(--color-primary)]"
                        : "border-s-transparent font-medium hover:bg-white"
                    )}
                    style={isActive ? { color: "var(--color-primary)" } : { color: "#1A1A1A" }}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center">
                      {c.image
                        ? <img src={c.image} alt={name(c)} className="w-full h-full object-cover" />
                        : <Layers size={14} className="text-gray-400" />}
                    </div>
                    <span className="flex-1">{name(c)}</span>
                  </Link>
                );
              })}
            </div>
            {/* Right: children grid */}
            <div className="flex-1 p-6 max-h-[420px] overflow-y-auto">
              {activeNode && (
                <>
                  <p className="text-[0.72rem] font-bold uppercase tracking-widest text-gray-400 mb-4">
                    {tHome("newIn")} {name(activeNode)}
                  </p>
                  {children.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/${locale}/products?category_id=${child.id}`}
                          className="group flex flex-col items-center gap-2 p-2 rounded-xl no-underline text-gray-800 transition hover:bg-gray-50"
                        >
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center transition group-hover:border-[var(--color-primary)] group-hover:scale-105">
                            {child.image
                              ? <img src={child.image} alt={name(child)} className="w-full h-full object-cover" />
                              : <Layers size={22} className="text-gray-400" />}
                          </div>
                          <span className="text-[0.75rem] font-medium text-center leading-tight">{name(child)}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{tHome("browseCategory")}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
