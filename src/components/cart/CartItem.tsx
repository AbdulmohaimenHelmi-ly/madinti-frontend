"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Settings2, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CartItem as CartItemType } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import VariantPickerDialog from "@/components/products/VariantPickerDialog";
import { cn } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
}

type QtyInputElement = HTMLInputElement | HTMLTextAreaElement;

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

export default function CartItem({ item }: CartItemProps) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItemVariant = useCartStore((s) => s.updateItemVariant);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const { toast, show, hide } = useToast();

  const commitQty = (input: QtyInputElement) => {
    const parsed = parseInt(input.value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) { input.value = String(item.quantity); return; }
    if (parsed === item.quantity) { input.value = String(item.quantity); return; }
    updateItem(item.id, parsed);
  };

  const productName =
    item.product && locale === "en" && item.product.name_en
      ? item.product.name_en
      : item.product?.name || "";

  const imageSrc =
    item.variant?.image ||
    (item.product as { image?: string | null } | undefined)?.image ||
    item.product?.images?.find((img) => img.is_primary)?.image ||
    item.product?.images?.[0]?.image ||
    "/placeholder-product.svg";

  const colorDot = item.variant?.options?.find((o) => o.hex_color)?.hex_color;
  const variantLabel =
    item.variant?.label ||
    item.variant?.options?.map((o) => {
      const opt = locale === "en" && o.option_en ? o.option_en : o.option;
      const val = locale === "en" && o.value_en ? o.value_en : o.value;
      return `${opt}: ${val}`;
    }).join(" / ") ||
    "";

  return (
    <>
      <div className="py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Image */}
        <div className="w-[90px] h-[90px] rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
          <img src={imageSrc} alt={productName} className="w-full h-full object-contain" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{productName}</p>
          {variantLabel && (
            <button
              type="button"
              onClick={item.product?.has_variants ? () => setVariantDialogOpen(true) : undefined}
              className={cn(
                "inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[0.72rem] font-semibold rounded-full border border-gray-200",
                item.product?.has_variants && "cursor-pointer hover:border-gray-400"
              )}
            >
              {colorDot && (
                <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: colorDot }} />
              )}
              {variantLabel}
              {item.product?.has_variants && <Settings2 size={10} />}
            </button>
          )}
          <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-primary)" }}>
            {Number(item.price).toFixed(2)} {t("currency")}
          </p>
        </div>

        {/* Qty */}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
          <button
            type="button"
            className="px-2 py-2 hover:bg-gray-50 transition"
            onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateItem(item.id, item.quantity - 1)}
            aria-label={item.quantity <= 1 ? t("remove") : t("decrease")}
          >
            <Minus size={14} />
          </button>
          <input
            key={`${item.id}:${item.quantity}`}
            defaultValue={String(item.quantity)}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={t("quantity")}
            className="w-11 text-center font-bold text-sm py-1.5 border-none outline-none bg-transparent"
            onChange={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ""); }}
            onBlur={(e) => commitQty(e.currentTarget)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitQty(e.currentTarget); e.currentTarget.blur(); } }}
          />
          <button
            type="button"
            className="px-2 py-2 hover:bg-gray-50 transition"
            onClick={() => updateItem(item.id, item.quantity + 1)}
            aria-label={t("increase")}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Total */}
        <p className="min-w-[80px] text-end font-extrabold text-sm shrink-0">
          {(Number(item.price) * item.quantity).toFixed(2)} {t("currency")}
        </p>

        {/* Remove */}
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          className="shrink-0 inline-flex items-center gap-1.5 border-2 border-red-300 text-red-600 rounded-xl px-3 py-1.5 text-sm font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition"
        >
          <Trash2 size={14} />
          {t("remove")}
        </button>
      </div>

      <hr className="border-gray-100 last:hidden" />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg cursor-pointer",
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          )}
          onClick={hide}
        >
          {toast.msg}
        </div>
      )}

      <VariantPickerDialog
        open={variantDialogOpen}
        productId={item.product_id}
        initialVariantId={item.product_variant_id ?? null}
        title={pt("selectVariant")}
        confirmLabel={t("save")}
        onClose={() => setVariantDialogOpen(false)}
        onConfirm={async (variantId) => {
          try {
            await updateItemVariant(item.id, variantId);
            show(t("success"), "success");
          } catch (err) {
            const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            const msg =
              e?.response?.data?.errors?.product_variant_id?.[0] ||
              e?.response?.data?.message ||
              t("error");
            show(msg, "error");
            throw err;
          }
        }}
      />
    </>
  );
}
