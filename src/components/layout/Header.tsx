"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart, User, X, Package, Layers, Store, Receipt, LogIn, UserPlus, PlusCircle, Shield, Truck, LogOut, PawPrint, Languages, Heart
} from "lucide-react";
import Navbar from "./Navbar";
import LanguageSwitcher from "./LanguageSwitcher";
import ProfileMenu from "./ProfileMenu";
import MobileAudienceIconBar from "@/components/home/MobileAudienceIconBar";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";

const mobileNavItems = [
  { key: "categories", path: "/categories", Icon: Layers },
  { key: "products", path: "/products", Icon: Package },
  { key: "vendors", path: "/vendors", Icon: Store },
  { key: "orders", path: "/orders", Icon: Receipt },
] as const;

export default function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const itemCount = useCartStore((s) => s.itemCount);

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${newLocale}${pathname.replace(/^\/(ar|en)/, "")}`);
  };

  if (
    pathname?.startsWith(`/${locale}/admin`) ||
    pathname?.startsWith(`/${locale}/vendor`) ||
    pathname?.startsWith(`/${locale}/delivery`)
  ) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F8]/95 backdrop-blur-xl border-b border-[#EDE7E9]">
        {/* Mobile toolbar */}
        <div className="flex md:hidden items-center gap-1 px-3 min-h-[56px]">
          <MobileAudienceIconBar />
          <div className="flex-1" />
          <button type="button" onClick={switchLocale} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"} className="p-2 text-[#1A1A1A] hover:bg-black/5 rounded-full">
            <Languages size={20} />
          </button>
          <Link href={`/${locale}/favorites`} aria-label={t("favorites")} className="p-2 text-[#1A1A1A] hover:bg-black/5 rounded-full">
            <Heart size={20} />
          </Link>
        </div>

        {/* Desktop toolbar */}
        <div className="hidden md:block">
          <div className="max-w-screen-lg mx-auto px-4 flex items-center gap-3 min-h-[64px]">
            <Link
              href={`/${locale}`}
              className="shrink-0 inline-flex items-center gap-2 no-underline"
            >
              <PawPrint
                size={24}
                className="-rotate-[15deg]"
                style={{ color: "var(--color-primary)", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.08))" }}
              />
              <span className="text-[1.4rem] font-extrabold tracking-wide text-[#1A1A1A]">{t("appName")}</span>
            </Link>

            <Navbar />
            <div className="flex-1" />

            <div className="flex items-center me-3">
              <MobileAudienceIconBar />
            </div>

            <LanguageSwitcher />

            <Link
              href={`/${locale}/cart`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE7E9] bg-white text-[#1A1A1A] hover:bg-[#F5F0F2] transition"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[0.6rem] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated && !user?.is_admin && !user?.is_vendor && !user?.is_delivery && (
              <Link
                href={`/${locale}/become-vendor`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE7E9] bg-white px-4 py-1.5 text-sm font-semibold text-[#1A1A1A] no-underline hover:bg-[#F5F0F2] transition"
              >
                <PlusCircle size={15} />
                {t("becomeVendor")}
              </Link>
            )}

            {!isInitialized ? (
              <div className="hidden sm:block h-10 w-28 rounded-full bg-white border border-[#EDE7E9]" />
            ) : isAuthenticated ? (
              <ProfileMenu />
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#EDE7E9] bg-white px-5 py-1.5 text-sm text-[#1A1A1A] no-underline hover:bg-[#F5F0F2] transition"
              >
                <User size={15} />
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside
            className={`relative z-10 w-[300px] bg-white h-full flex flex-col shadow-2xl ${locale === "ar" ? "ms-auto" : "me-auto"}`}
          >
            <div
              className="flex items-center justify-between p-5 text-white"
              style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
            >
              <span className="inline-flex items-center gap-2 text-lg font-extrabold">
                <PawPrint size={20} className="-rotate-[15deg]" />
                {t("appName")}
              </span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="p-1 rounded-full hover:bg-white/20">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto">
              <ul className="px-3 pt-2">
                {mobileNavItems.map((item) => (
                  <li key={item.key} className="mb-1">
                    <Link
                      href={`/${locale}${item.path}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition"
                    >
                      <item.Icon size={16} />
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
              <hr className="mx-4 my-2 border-gray-100" />
              <ul className="px-3">
                {isAuthenticated ? (
                  <>
                    {user?.is_admin && (
                      <li className="mb-1">
                        <Link href={`/${locale}/admin`} onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                          <Shield size={16} /> {t("adminPanel")}
                        </Link>
                      </li>
                    )}
                    {user?.is_vendor && (
                      <li className="mb-1">
                        <Link href={`/${locale}/vendor`} onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                          <Store size={16} /> {t("vendorDashboard")}
                        </Link>
                      </li>
                    )}
                    {user?.is_delivery && (
                      <li className="mb-1">
                        <Link href={`/${locale}/delivery`} onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                          <Truck size={16} /> {t("deliveryDashboard")}
                        </Link>
                      </li>
                    )}
                    <li className="mb-1">
                      <Link href={`/${locale}/profile`} onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                        <User size={16} /> {t("myProfile")}
                      </Link>
                    </li>
                    {!user?.is_vendor && !user?.is_admin && !user?.is_delivery && (
                      <li className="mb-1">
                        <Link href={`/${locale}/become-vendor`} onClick={() => setDrawerOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                          <PlusCircle size={16} /> {t("becomeVendor")}
                        </Link>
                      </li>
                    )}
                    <li className="mb-1">
                      <button type="button" onClick={async () => { setDrawerOpen(false); await logout(); }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500 hover:text-white transition">
                        <LogOut size={16} /> {t("logout")}
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="mb-1">
                      <Link href={`/${locale}/auth/login`} onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                        <LogIn size={16} /> {t("login")}
                      </Link>
                    </li>
                    <li className="mb-1">
                      <Link href={`/${locale}/auth/register`} onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 no-underline hover:bg-[var(--color-primary)] hover:text-white transition">
                        <UserPlus size={16} /> {t("register")}
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
