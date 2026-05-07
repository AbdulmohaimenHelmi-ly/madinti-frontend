"use client";
import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import ProductGrid from "@/components/products/ProductGrid";
import EmptyState from "@/components/common/EmptyState";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import { useAuthStore } from "@/lib/store/authStore";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { wishlistApi } from "@/lib/api/wishlist";
import type { Product } from "@/lib/types";

export default function FavoritesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const wishlistInitialized = useWishlistStore((s) => s.isInitialized);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { setIsLoading(false); setHasFetched(true); return; }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const response = await wishlistApi.list({ per_page: 24 });
        const data = response.data.data ?? [];
        if (!cancelled) setProducts(data);
      } catch { if (!cancelled) setProducts([]); }
      finally { if (!cancelled) { setIsLoading(false); setHasFetched(true); } }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, isInitialized]);

  const visibleProducts = useMemo(
    () => wishlistInitialized ? products.filter((p) => wishlistIds.has(p.id)) : products,
    [products, wishlistIds, wishlistInitialized]
  );

  if (isInitialized && !isAuthenticated) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <EmptyState message={t("product.noFavorites")} />
        <div className="text-center mt-6">
          <Link href={`/${locale}/auth/login`} className="inline-flex items-center px-8 py-3 rounded-full text-white font-bold no-underline" style={{ background: "var(--color-primary)" }}>
            {t("auth.loginTitle")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={22} className="text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold">{t("product.myFavorites")}</h1>
      </div>
      {isLoading || !hasFetched ? <ProductGridSkeleton count={8} /> :
        visibleProducts.length === 0 ? (
          <>
            <EmptyState message={t("product.noFavorites")} />
            <div className="text-center mt-6">
              <Link href={`/${locale}/products`} className="inline-flex items-center px-8 py-3 rounded-full text-white font-bold no-underline" style={{ background: "var(--color-primary)" }}>
                {t("cart.continueShopping")}
              </Link>
            </div>
          </>
        ) : <ProductGrid products={visibleProducts} />
      }
    </div>
  );
}
