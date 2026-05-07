"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductOption, ProductOptionValue, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VariantPickerDialogProps {
  open: boolean;
  productId: number | null;
  initialProduct?: Product | null;
  initialVariantId?: number | null;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (variantId: number) => Promise<void> | void;
}

export default function VariantPickerDialog({
  open,
  productId,
  initialProduct,
  initialVariantId,
  title,
  confirmLabel,
  onClose,
  onConfirm,
}: VariantPickerDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [selection, setSelection] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!open || !productId) return;
    if (initialProduct && initialProduct.id === productId && initialProduct.variants) {
      setProduct(initialProduct);
      return;
    }
    setLoading(true);
    productsApi
      .getById(productId)
      .then((res) => setProduct(res.data.data))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [open, productId, initialProduct, t]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSelection({});
  }, [open, productId]);

  const options: ProductOption[] = useMemo(
    () => (product?.options || []).slice().sort((a, b) => a.position - b.position),
    [product]
  );
  const variants: ProductVariant[] = useMemo(
    () => (product?.variants || []).filter((v) => v.is_active),
    [product]
  );

  useEffect(() => {
    if (!open || !product || options.length === 0 || variants.length === 0) return;
    if (Object.keys(selection).length > 0) return;
    const target =
      (initialVariantId && variants.find((v) => v.id === initialVariantId)) ||
      variants.find((v) => v.is_default) ||
      variants.find((v) => Number(v.quantity) > 0) ||
      variants[0];
    if (!target) return;
    const picks: Record<number, number> = {};
    for (const opt of options) {
      const valId = target.option_value_ids.find((id) =>
        opt.values.some((vv) => vv.id === id)
      );
      if (valId) picks[opt.id] = valId;
    }
    if (Object.keys(picks).length > 0) setSelection(picks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, options, variants, initialVariantId]);

  const allOptionsPicked = options.length > 0 && options.every((o) => selection[o.id]);
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!allOptionsPicked) return null;
    const picked = new Set(Object.values(selection));
    return (
      variants.find(
        (v) =>
          v.option_value_ids.length === picked.size &&
          v.option_value_ids.every((id) => picked.has(id))
      ) || null
    );
  }, [allOptionsPicked, selection, variants]);

  const availableValueIds = useMemo<Record<number, Set<number>>>(() => {
    const result: Record<number, Set<number>> = {};
    for (const opt of options) {
      const otherPicks = Object.entries(selection)
        .filter(([oid]) => Number(oid) !== opt.id)
        .map(([, vid]) => vid);
      const set = new Set<number>();
      for (const v of variants) {
        if (Number(v.quantity) <= 0) continue;
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
  }, [options, variants, selection]);

  const optionLabel = (o: ProductOption) => locale === "en" && o.name_en ? o.name_en : o.name;
  const valueLabel = (v: ProductOptionValue) => locale === "en" && v.value_en ? v.value_en : v.value;

  const handleConfirm = async () => {
    if (!selectedVariant) { setError(t("product.pleaseSelectVariant")); return; }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(selectedVariant.id);
      onClose();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg =
        err?.response?.data?.errors?.variant_id?.[0] ||
        err?.response?.data?.errors?.quantity?.[0] ||
        err?.response?.data?.message ||
        t("common.error");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const productName = product
    ? locale === "en" && product.name_en ? product.name_en : product.name
    : "";

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between p-5 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-base font-bold">
                {title || t("product.selectVariant")}
              </Dialog.Title>
              {productName && (
                <p className="text-sm text-gray-500 mt-0.5">{productName}</p>
              )}
            </div>
            <Dialog.Close className="rounded-lg p-1 hover:bg-gray-100 transition" disabled={submitting}>
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
              </div>
            ) : !product ? (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} /> {error || t("common.error")}
              </div>
            ) : options.length === 0 ? (
              <p className="text-sm text-amber-600">{t("product.outOfStock")}</p>
            ) : (
              <div className="flex flex-col gap-5">
                {options.map((opt) => {
                  const available = availableValueIds[opt.id] || new Set<number>();
                  return (
                    <div key={opt.id}>
                      <p className="text-sm font-semibold mb-2">{optionLabel(opt)}</p>
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map((val) => {
                          const isSelected = selection[opt.id] === val.id;
                          const isAvailable = available.has(val.id);
                          return (
                            <button
                              key={val.id}
                              type="button"
                              disabled={!isAvailable && !isSelected}
                              onClick={() => setSelection((prev) => ({ ...prev, [opt.id]: val.id }))}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                                isSelected
                                  ? "text-white border-transparent"
                                  : "border-gray-200 hover:border-gray-400",
                                !isAvailable && !isSelected && "opacity-40 cursor-not-allowed"
                              )}
                              style={isSelected ? { backgroundColor: "var(--color-primary)" } : {}}
                            >
                              {val.hex_color && (
                                <span
                                  className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300"
                                  style={{ backgroundColor: val.hex_color }}
                                />
                              )}
                              {valueLabel(val)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {selectedVariant && (
                  <p className="text-sm text-gray-500">
                    {t("common.currency")} {Number(selectedVariant.price).toFixed(2)}
                    {Number(selectedVariant.quantity) <= 0 && <span> · {t("product.outOfStock")}</span>}
                  </p>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || loading || !selectedVariant || Number(selectedVariant?.quantity) <= 0}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {confirmLabel || t("product.addToCart")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
