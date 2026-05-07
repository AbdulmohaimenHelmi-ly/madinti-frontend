"use client";

import { useState } from "react";
import { ShoppingCart, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import FavoriteButton from "./FavoriteButton";
import VariantPickerDialog from "./VariantPickerDialog";
import { cn } from "@/lib/utils";

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

export default function ProductRailCard({ product }: { product: Product }) {
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
  const outOfStock = quantity <= 0;

  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageSrc =
    primaryImage?.image ||
    (product as unknown as { image?: string }).image ||
    "/placeholder-product.svg";

  const hasDiscount = comparePrice !== null && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round(((comparePrice! - price) / comparePrice!) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    if (product.has_variants) { setVariantDialogOpen(true); return; }
    setAdding(true);
    try {
      await addItem(product.id, 1, null);
      show(pt("addedToCart"), "success");
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      show(e2.response?.data?.message ?? t("error"), "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[18px] border border-[#EDE7E9] overflow-hidden">
      <Link
        href={`/${locale}/products/${product.id}`}
        className="relative block w-full bg-[#F5F0F2] shrink-0 overflow-hidden"
        style={{ aspectRatio: "1/1" }}
      >
        <img src={imageSrc} alt={name} loading="lazy" className="w-full h-full object-cover" />
        {hasDiscount && (
          <span className="absolute top-2 start-2 bg-[var(--color-secondary)] text-white text-[0.68rem] font-extrabold px-1.5 py-0.5 rounded-lg leading-tight shadow">
            -{discountPercent}%
          </span>
        )}
        <div className="absolute top-1.5 end-1.5 z-10">
          <FavoriteButton productId={product.id} size="small" />
        </div>
        {!outOfStock && (
          <div className="absolute bottom-1.5 end-1.5 z-10">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              aria-label={t("addToCart")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-70"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
            </button>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-sm font-bold">
            {pt("outOfStock")}
          </div>
        )}
      </Link>

      <div className="px-2.5 pt-2.5 pb-3 flex flex-col gap-1.5 flex-1 min-h-0">
        <Link
          href={`/${locale}/products/${product.id}`}
          className="line-clamp-2 text-[0.82rem] font-semibold leading-tight text-gray-800 no-underline"
        >
          {name}
        </Link>
        {totalReviews > 0 && (
          <div className="flex items-center gap-0.5">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-[0.72rem] font-semibold">{rating.toFixed(1)}</span>
            <span className="text-[0.7rem] text-gray-400">({totalReviews})</span>
          </div>
        )}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-extrabold text-[0.95rem] whitespace-nowrap" style={{ color: "var(--color-primary)" }}>
            {price.toFixed(2)} {t("currency")}
          </span>
          {hasDiscount && (
            <span className="text-[0.72rem] text-gray-300 line-through whitespace-nowrap">
              {comparePrice!.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg",
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
