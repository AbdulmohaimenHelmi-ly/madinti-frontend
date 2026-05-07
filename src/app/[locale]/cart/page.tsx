"use client";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingCart, Trash2, Store } from "lucide-react";
import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { CartSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";

export default function CartPage() {
  const t = useTranslations();
  const locale = useLocale();
  const carts = useCartStore((s) => s.carts);
  const isLoading = useCartStore((s) => s.isLoading);
  const fetchCarts = useCartStore((s) => s.fetchCarts);
  const clearAllCarts = useCartStore((s) => s.clearAllCarts);
  const clearVendorCart = useCartStore((s) => s.clearVendorCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => { if (isAuthenticated) fetchCarts(); }, [isAuthenticated, fetchCarts]);

  const handleClearAll = () => {
    if (typeof window !== "undefined" && !window.confirm(t("cart.confirmClear"))) return;
    clearAllCarts();
  };

  const handleClearVendor = (vendorId: number) => {
    if (typeof window !== "undefined" && !window.confirm(t("cart.confirmClearVendor"))) return;
    clearVendorCart(vendorId);
  };

  if (isLoading && carts.length === 0) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-6">{t("cart.title")}</h1>
        <CartSkeleton />
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-12">
        <EmptyState message={t("cart.empty")} />
        <div className="text-center mt-6">
          <Link href={`/${locale}/products`} className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold no-underline" style={{ background: "var(--color-primary)" }}>
            <ShoppingCart size={18} />{t("cart.continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">{t("cart.title")}</h1>
          <p className="text-gray-500">{t("cart.vendorSubtitle", { count: carts.length })}</p>
          <div className="mt-2 w-12 h-1 rounded-full" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
        </div>
        <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
          <Trash2 size={16} />{t("cart.clearAll")}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {carts.map((cart) => {
          const vendorName = (locale === "en" && cart.vendor?.store_name_en) || cart.vendor?.store_name || "";
          return (
            <div key={cart.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 overflow-hidden" style={{ background: "var(--color-primary)" }}>
                      {cart.vendor?.logo ? <img src={cart.vendor.logo} alt="" className="w-full h-full object-cover" /> : <Store size={20} />}
                    </div>
                    <div>
                      {cart.vendor?.slug ? (
                        <Link href={`/${locale}/vendors/${cart.vendor.slug}`} className="font-extrabold text-base text-gray-900 no-underline hover:text-[var(--color-primary)] transition-colors">
                          {vendorName || t("cart.unknownVendor")}
                        </Link>
                      ) : (
                        <span className="font-extrabold text-base text-gray-900">{vendorName || t("cart.unknownVendor")}</span>
                      )}
                      <p className="text-xs text-gray-400">{t("cart.itemsCount", { count: cart.items_count })}</p>
                    </div>
                  </div>
                  <button onClick={() => handleClearVendor(cart.vendor_id)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors self-end sm:self-center">
                    <Trash2 size={14} />{t("cart.clearVendor")}
                  </button>
                </div>
                <hr className="border-gray-100 mb-4" />
                <div className="mb-4">{cart.items.map((item) => <CartItem key={item.id} item={item} />)}</div>
                <CartSummary cart={cart} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
