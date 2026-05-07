"use client";

import { useState } from "react";
import { ShoppingCart, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import FavoriteButton from "./FavoriteButton";
import VariantPickerDialog from "./VariantPickerDialog";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

let toastId = 0;
function useToast() {
  const [toast, setToast] = useState<{ id: number; msg: string; type: "success" | "error" } | null>(null);
  const show = (msg: string, type: "success" | "error") => {
    const id = ++toastId;
    setToast({ id, msg, type });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500);
  };
  return { toast, show, hide: () => setToast(null) };
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();
  const name = locale === "en" && product.name_en ? product.name_en : product.name;

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [adding, setAdding] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const { toast, show, hide } = useToast();

  const price = Number(product.price) || 0;
  const comparePrice = product.compare_price != null ? Number(product.compare_price) : null;
  const rating = Number(product.rating) || 0;
  const totalReviews = Number(product.total_reviews) || 0;
  const quantity = Number(product.quantity) || 0;

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageSrc =
    primaryImage?.image ||
    (product as unknown as { image?: string }).image ||
    "/placeholder-product.svg";

  const hasDiscount = comparePrice !== null && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0;
  const soldCount = Math.max(totalReviews * 37, 0);
  const soldLabel =
    soldCount >= 1000
      ? `${(soldCount / 1000).toFixed(1).replace(/\.0$/, "")}k+ ${pt("sold")}`
      : soldCount > 0 ? `${soldCount}+ ${pt("sold")}` : "";
  const outOfStock = quantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push(`/${locale}/login`); return; }
    if (product.has_variants) { setVariantDialogOpen(true); return; }
    setAdding(true);
    try {
      await addItem(product.id, 1, null);
      show(pt("addedToCart"), "success");
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e2.response?.data?.errors?.quantity?.[0] || e2.response?.data?.message || t("error");
      show(msg, "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col h-full bg-transparent">
      {/* Image */}
      <Link
        href={`/${locale}/products/${product.id}`}
        className="relative block w-full overflow-hidden bg-gray-100 rounded"
        style={{ aspectRatio: "3/4" }}
      >
        <img
          src={imageSrc}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute top-2 start-2 bg-red-500 text-white text-[0.7rem] font-bold px-1.5 py-0.5 rounded-sm leading-tight">
            -{discountPercent}%
          </span>
        )}
        {product.is_featured && !hasDiscount && (
          <span className="absolute top-2 start-2 bg-green-600 text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
            {pt("featured")}
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-sm font-bold">
            {pt("outOfStock")}
          </div>
        )}
      </Link>

      {/* Favorite */}
      <div className="absolute top-1.5 end-1.5 z-10">
        <FavoriteButton productId={product.id} size="small" />
      </div>

      {/* Meta */}
      <div className="pt-2 px-0.5 flex flex-col gap-1 flex-1">
        <Link
          href={`/${locale}/products/${product.id}`}
          className="flex items-center gap-1 text-sm no-underline text-gray-800"
        >
          {hasDiscount && (
            <span className="shrink-0 bg-red-100 text-red-600 text-[0.7rem] font-bold px-1 py-0.5 rounded-sm">
              -{discountPercent}%
            </span>
          )}
          <span className="truncate font-medium text-[0.82rem]">{name}</span>
        </Link>

        {product.is_featured && (
          <span className="self-start bg-amber-100 text-amber-800 text-[0.7rem] font-bold px-1.5 py-0.5 rounded-sm truncate">
            {pt("featured")}
          </span>
        )}

        {totalReviews > 0 && (
          <div className="flex items-center gap-0.5">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-[0.72rem] text-gray-500 font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[0.72rem] text-gray-400">({totalReviews}{totalReviews >= 100 ? "+" : ""})</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-red-500 font-extrabold text-base leading-tight whitespace-nowrap">
              {t("currency")} {price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-[0.72rem] text-gray-300 line-through whitespace-nowrap">
                {comparePrice!.toFixed(2)}
              </span>
            )}
            {soldLabel && (
              <span className="text-[0.72rem] text-gray-400 whitespace-nowrap">{soldLabel}</span>
            )}
          </div>

          {!outOfStock && (
            <button
              aria-label={t("addToCart")}
              onClick={handleAddToCart}
              disabled={adding}
              className={cn(
                "shrink-0 w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center transition-all duration-200",
                "group-hover:bg-[var(--color-primary)] group-hover:border-[var(--color-primary)] group-hover:text-white text-gray-700"
              )}
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <ShoppingCart size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all",
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          )}
          onClick={hide}
        >
          {toast.msg}
        </div>
      )}

      <VariantPickerDialog
        open={variantDialogOpen}
        productId={product.id}
        onClose={() => setVariantDialogOpen(false)}
        onConfirm={async (variantId) => {
          await addItem(product.id, 1, variantId);
          show(pt("addedToCart"), "success");
        }}
        confirmLabel={t("addToCart")}
      />
    </div>
  );
}
