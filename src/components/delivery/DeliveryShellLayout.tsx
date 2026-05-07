"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Truck, DollarSign, Building2, ListOrdered, PawPrint, Menu, LogOut, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";

const DRAWER_WIDTH = 264;

export default function DeliveryShellLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("delivery");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isInitialized) initialize(); }, [isInitialized, initialize]);
  useEffect(() => {
    if (!isInitialized || isLoading) return;
    if (!token) { router.replace(`/${locale}/auth/login`); return; }
    if (user && !user.is_delivery && !user.is_admin) router.replace(`/${locale}`);
  }, [isInitialized, isLoading, user, token, locale, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const links = useMemo(() => [
    { label: t("dashboard"), href: `/${locale}/delivery`, icon: LayoutDashboard, exact: true },
    { label: t("company"), href: `/${locale}/delivery/company`, icon: Building2 },
    { label: t("orders"), href: `/${locale}/delivery/orders`, icon: ListOrdered },
    { label: t("prices"), href: `/${locale}/delivery/prices`, icon: DollarSign },
  ], [t, locale]);

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const currentPage = links.find((l) => isActive(l.href, l.exact));
  const handleLogout = async () => { setMenuOpen(false); try { await logout(); } finally { router.replace(`/${locale}/auth/login`); } };

  if (!user || (!user.is_delivery && !user.is_admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col" style={{ background: "#0F172A", color: "rgba(255,255,255,0.72)" }}>
      <div className="flex items-center gap-3 px-6 border-b border-white/5" style={{ height: 64 }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}>
          <Truck size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-extrabold text-sm flex items-center gap-1.5 whitespace-nowrap">
            <PawPrint size={14} className="-rotate-[15deg]" /> {tCommon("appName")}
          </p>
          <p className="text-[0.7rem] text-white/40 tracking-wide">{t("panel")}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {links.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition-all", active ? "font-bold" : "font-medium hover:bg-white/5 hover:text-white")}
                  style={active ? { color: "var(--color-primary-light)", background: "rgba(255,255,255,0.08)" } : {}}>
                  <link.icon size={16} /> {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="p-3 border-t border-white/5">
        <Link href={`/${locale}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline transition hover:bg-white/5 hover:text-white" style={{ color: "rgba(255,255,255,0.72)" }}>
          <ExternalLink size={15} /> {t("visitSite")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F6FA]">
      <aside className="hidden md:block shrink-0 sticky top-0 self-start h-screen overflow-hidden" style={{ width: DRAWER_WIDTH }}>
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className={`relative z-10 h-full ${locale === "ar" ? "ms-auto" : "me-auto"}`} style={{ width: DRAWER_WIDTH }}>
            <SidebarContent />
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 border-b border-gray-100 bg-white" style={{ height: 64 }}>
          <button type="button" className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <h1 className="font-bold text-gray-900 text-base">{currentPage?.label ?? t("dashboard")}</h1>
          <div className="flex-1" />
          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white text-sm"
              style={{ background: "var(--color-primary)" }}>
              {user.name?.[0]?.toUpperCase() ?? "D"}
            </button>
            {menuOpen && (
              <div className="absolute end-0 top-full mt-2 min-w-[180px] rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden z-50">
                <button type="button" onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                  <LogOut size={14} /> {tCommon("logout")}
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
