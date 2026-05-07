"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingCart, Store, Check, Plus, Minus, AlertTriangle, CheckCircle, Star } from "lucide-react";
import FavoriteButton from "@/components/products/FavoriteButton";
import type { Product, ProductOption, ProductOptionValue, ProductVariant } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import { cn } from "@/lib/utils";

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selection, setSelection] = useState<Record<number, number>>({});
  const [variantError, setVariantError] = useState<string>("");
  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const addItem = useCartStore((s) => s.addItem);

  const name = locale === "en" && product.name_en ? product.name_en : product.name;
  const description = locale === "en" && product.description_en ? product.description_en : product.description;

  const hasVariants = !!product.has_variants;
  const options: ProductOption[] = useMemo(() => (product.options || []).slice().sort((a, b) => a.position - b.position), [product.options]);
  const variants: ProductVariant[] = useMemo(() => (product.variants || []).filter((v) => v.is_active), [product.variants]);

  useEffect(() => {
    if (!hasVariants || variants.length === 0 || options.length === 0) return;
    if (Object.keys(selection).length > 0) return;
    const defaultVariant = variants.find((v) => v.is_default) || variants.find((v) => Number(v.quantity) > 0) || variants[0];
    if (!defaultVariant) return;
    const picks: Record<number, number> = {};
    for (const opt of options) {
      const valId = defaultVariant.option_value_ids.find((id) => opt.values.some((vv) => vv.id === id));
      if (valId) picks[opt.id] = valId;
    }
    if (Object.keys(picks).length > 0) setSelection(picks);
  }, [product.id, hasVariants]);

  const allOptionsPicked = options.length > 0 && options.every((o) => selection[o.id]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants || !allOptionsPicked) return null;
    const picked = new Set(Object.values(selection));
    return variants.find((v) => v.option_value_ids.length === picked.size && v.option_value_ids.every((id) => picked.has(id))) || null;
  }, [hasVariants, allOptionsPicked, selection, variants]);

  const availableValueIds = useMemo<Record<number, Set<number>>>(() => {
    const result: Record<number, Set<number>> = {};
    if (!hasVariants) return result;
    for (const opt of options) {
      const otherPicks = Object.entries(selection).filter(([oid]) => Number(oid) !== opt.id).map(([, vid]) => vid);
      const set = new Set<number>();
      for (const v of variants) {
        if (v.quantity <= 0) continue;
        const matches = otherPicks.every((vid) => v.option_value_ids.includes(vid));
        if (matches) {
          for (const vid of v.option_value_ids) {
            if (opt.values.some((ov) => ov.id === vid)) set.add(vid);
          }
        }
      }
      result[opt.id] = set;
    }
    return result;
  }, [hasVariants, options, variants, selection]);

  const basePrice = Number(product.price) || 0;
  const effectivePrice = hasVariants && selectedVariant ? Number(selectedVariant.price) || 0 : basePrice;
  const effectiveStock = hasVariants ? (selectedVariant ? Number(selectedVariant.quantity) || 0 : 0) : product.quantity;
  const comparePrice = hasVariants && selectedVariant && selectedVariant.compare_price != null
    ? Number(selectedVariant.compare_price)
    : product.compare_price != null ? Number(product.compare_price) : null;
  const hasDiscount = comparePrice !== null && comparePrice > effectivePrice;
  const discountPercent = hasDiscount ? Math.round(((comparePrice! - effectivePrice) / comparePrice!) * 100) : 0;

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) { setVariantError(t("product.pleaseSelectVariant")); return; }
    setVariantError(""); setAddSuccess(false);
    try {
      await addItem(product.id, quantity, selectedVariant ? selectedVariant.id : null);
      setAddSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = err?.response?.data?.errors?.variant_id?.[0] || err?.response?.data?.errors?.quantity?.[0] || err?.response?.data?.message || t("common.error");
      setVariantError(msg);
    }
  };

  const optionLabel = (o: ProductOption) => locale === "en" && o.name_en ? o.name_en : o.name;
  const valueLabel = (v: ProductOptionValue) => locale === "en" && v.value_en ? v.value_en : v.value;
  const isColorOption = (o: ProductOption) => o.values.some((v) => !!v.hex_color);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      {/* Images */}
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-3">
          <img
            src={selectedVariant?.image || product.images?.[selectedImage]?.image || "/placeholder-product.svg"}
            alt={name}
            className="w-full h-[450px] object-contain transition-transform duration-300 hover:scale-[1.03]"
          />
        </div>
        {product.images && product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {product.images.map((img, idx) => (
              <button key={img.id} type="button" onClick={() => setSelectedImage(idx)}
                className={cn("w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200", idx === selectedImage ? "border-[var(--color-primary)] opacity-100" : "border-gray-200 opacity-70 hover:opacity-100 hover:border-[var(--color-primary-light)]")}>
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-gray-900">{name}</h1>
          <div className="shrink-0">
            <FavoriteButton productId={product.id} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className={cn(i <= Math.round(Number(product.rating)) ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.total_reviews} {t("product.reviews")})</span>
        </div>

        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-3xl font-extrabold" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {effectivePrice.toFixed(2)} {t("common.currency")}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-gray-400 line-through">{comparePrice!.toFixed(2)} {t("common.currency")}</span>
              <span className="text-sm font-bold bg-orange-500 text-white rounded-full px-2 py-0.5">-{discountPercent}%</span>
            </>
          )}
        </div>

        <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1 mb-4", effectiveStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600")}>
          {effectiveStock > 0 ? t("product.inStock") : t("product.outOfStock")}
        </span>

        <hr className="border-gray-100 mb-4" />

        <p className="text-gray-600 leading-[1.9] mb-4">{description}</p>

        {product.vendor && (
          <div className="flex items-center gap-2 mb-1.5 text-sm text-gray-500">
            <Store size={14} />
            {t("product.vendor")}: <span className="font-semibold text-gray-800">
              {locale === "en" && product.vendor.store_name_en ? product.vendor.store_name_en : product.vendor.store_name}
            </span>
          </div>
        )}
        {product.sku && (
          <p className="text-sm text-gray-400 mb-4">{t("product.sku")}: <span className="font-medium text-gray-600">{product.sku}</span></p>
        )}

        <hr className="border-gray-100 mb-4" />

        {hasVariants && (
          <div className="mb-4">
            {options.map((opt) => {
              const colorMode = isColorOption(opt);
              const available = availableValueIds[opt.id] || new Set<number>();
              const pickedValueId = selection[opt.id];
              const pickedValue = opt.values.find((v) => v.id === pickedValueId);
              return (
                <div key={opt.id} className="mb-5">
                  <p className="text-sm font-bold mb-2">
                    {optionLabel(opt)}
                    {pickedValue && <span className="text-gray-500 font-normal ms-1">— {valueLabel(pickedValue)}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.slice().sort((a, b) => a.position - b.position).map((val) => {
                      const isSelected = pickedValueId === val.id;
                      const isAvailable = available.has(val.id);
                      if (colorMode) {
                        return (
                          <button key={val.id} type="button" title={valueLabel(val)}
                            onClick={() => { if (!isAvailable) return; setSelection((s) => ({ ...s, [opt.id]: val.id })); setVariantError(""); }}
                            className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center text-white transition-all", isSelected ? "border-[var(--color-primary)] outline outline-2 outline-offset-2 outline-[var(--color-primary-light)]" : "border-gray-300", !isAvailable && "opacity-35 cursor-not-allowed")}
                            style={{ background: val.hex_color || "#9CA3AF" }}>
                            {isSelected && <Check size={14} />}
                          </button>
                        );
                      }
                      return (
                        <button key={val.id} type="button" disabled={!isAvailable}
                          onClick={() => { setSelection((s) => ({ ...s, [opt.id]: val.id })); setVariantError(""); }}
                          className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold border transition-all", isSelected ? "border-[var(--color-primary)] text-white" : "border-gray-200 text-gray-700 hover:border-[var(--color-primary)]", !isAvailable && "opacity-35 cursor-not-allowed")}
                          style={isSelected ? { background: "var(--color-primary)" } : {}}>
                          {valueLabel(val)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {effectiveStock > 0 && (
          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold text-sm">{t("common.quantity")}:</span>
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition">
                <Minus size={14} />
              </button>
              <span className="w-12 text-center font-bold text-sm">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))} className="px-3 py-2 hover:bg-gray-100 transition">
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {variantError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-3 text-sm text-red-700">
            <AlertTriangle size={15} /> {variantError}
          </div>
        )}
        {addSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 mb-3 text-sm text-green-700">
            <CheckCircle size={15} /> {t("product.addedToCart")}
          </div>
        )}

        <button type="button" onClick={handleAddToCart} disabled={effectiveStock === 0}
          className={cn("w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all", effectiveStock === 0 ? "opacity-50 cursor-not-allowed bg-gray-400" : "hover:opacity-90")}
          style={effectiveStock > 0 ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" } : {}}>
          <ShoppingCart size={18} />
          {t("common.addToCart")}
        </button>
      </div>
    </div>
  );
}
