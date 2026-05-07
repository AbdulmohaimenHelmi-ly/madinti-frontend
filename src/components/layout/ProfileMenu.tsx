"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Settings, Truck, Store, ShoppingCart, Receipt, User, PlusCircle, LogOut, ChevronDown, Heart, Shield
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";

export default function ProfileMenu() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (!user) return null;

  const close = () => setOpen(false);
  const handleLogout = async () => { close(); await logout(); router.push(`/${locale}`); };
  const p = `/${locale}`;

  const menuItems = [
    ...(user.is_admin ? [{ href: `${p}/admin`, icon: <Shield size={15} style={{ color: "var(--color-primary)" }} />, label: t("adminPanel") }] : []),
    ...(user.is_vendor ? [{ href: `${p}/vendor`, icon: <Store size={15} style={{ color: "var(--color-primary)" }} />, label: t("vendorDashboard") }] : []),
    ...(user.is_delivery ? [{ href: `${p}/delivery`, icon: <Truck size={15} style={{ color: "var(--color-primary)" }} />, label: t("deliveryDashboard") }] : []),
  ];
  const hasDash = menuItems.length > 0;
  const customerItems = [
    { href: `${p}/profile`, icon: <User size={15} className="text-gray-500" />, label: t("myProfile") },
    { href: `${p}/orders`, icon: <Receipt size={15} className="text-gray-500" />, label: t("myOrders") },
    { href: `${p}/cart`, icon: <ShoppingCart size={15} className="text-gray-500" />, label: t("myCart") },
    { href: `${p}/favorites`, icon: <Heart size={15} className="text-red-400" />, label: t("myFavorites") },
    ...(!user.is_vendor && !user.is_admin && !user.is_delivery
      ? [{ href: `${p}/become-vendor`, icon: <PlusCircle size={15} className="text-gray-500" />, label: t("becomeVendor") }]
      : []),
  ];

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-[#EDE7E9] bg-white py-1 ps-1.5 pe-3 text-[#1A1A1A] transition hover:bg-[#F5F0F2]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F0F2] text-sm font-bold">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-medium">{user.name?.split(" ")[0]}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[260px] rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-sm truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {hasDash && (
            <>
              <div className="py-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 no-underline hover:bg-gray-50 transition"
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
              <hr className="border-gray-100" />
            </>
          )}

          <div className="py-1">
            {customerItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 no-underline hover:bg-gray-50 transition"
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>

          <hr className="border-gray-100" />
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={15} /> {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
