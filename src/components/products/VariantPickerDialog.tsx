"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductOption, ProductOptionValue, ProductVariant } from "@/lib/types";

interface VariantPickerDialogProps {
  open: boolean;
  productId: number | null;
  /** Optional pre-fetched product to avoid an extra HTTP call. */
  initialProduct?: Product | null;
  /** Variant currently selected (so we can preselect on open). */
  initialVariantId?: number | null;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (variantId: number) => Promise<void> | void;
}

/**
 * Modal that lets the user pick a variant of a product by selecting one value
 * per option (Color, Size, etc.). Used by the product card "Add to cart" flow
 * and the cart "Change variant" flow.
 */
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

  // Fetch the full product (with options + variants) when the dialog opens
  // unless the caller supplied one.
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

  // Reset state when the dialog reopens for a different product/variant.
  useEffect(() => {
    if (!open) return;
    setError("");
    setSelection({});
  }, [open, productId]);

  const options: ProductOption[] = useMemo(
    () =>
      (product?.options || []).slice().sort((a, b) => a.position - b.position),
    [product]
  );
  const variants: ProductVariant[] = useMemo(
    () => (product?.variants || []).filter((v) => v.is_active),
    [product]
  );

  // Preselect the initial variant or a sensible default.
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

  const allOptionsPicked =
    options.length > 0 && options.every((o) => selection[o.id]);

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

  // Hide values that don't compose with the other selections (out of stock).
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

  const optionLabel = (o: ProductOption) =>
    locale === "en" && o.name_en ? o.name_en : o.name;
  const valueLabel = (v: ProductOptionValue) =>
    locale === "en" && v.value_en ? v.value_en : v.value;

  const handleConfirm = async () => {
    if (!selectedVariant) {
      setError(t("product.pleaseSelectVariant"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(selectedVariant.id);
      onClose();
    } catch (e) {
      const err = e as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
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
    ? locale === "en" && product.name_en
      ? product.name_en
      : product.name
    : "";

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {title || t("product.selectVariant")}
        {productName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {productName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !product ? (
          <Alert severity="error">{error || t("common.error")}</Alert>
        ) : options.length === 0 ? (
          <Alert severity="warning">{t("product.outOfStock")}</Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {options.map((opt) => {
              const available = availableValueIds[opt.id] || new Set<number>();
              return (
                <Box key={opt.id}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>
                    {optionLabel(opt)}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {opt.values.map((val) => {
                      const isSelected = selection[opt.id] === val.id;
                      const isAvailable = available.has(val.id);
                      return (
                        <Chip
                          key={val.id}
                          label={
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                              {val.hex_color && (
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    bgcolor: val.hex_color,
                                    border: "1px solid",
                                    borderColor: "grey.400",
                                  }}
                                />
                              )}
                              <span>{valueLabel(val)}</span>
                            </Box>
                          }
                          onClick={() =>
                            setSelection((prev) => ({ ...prev, [opt.id]: val.id }))
                          }
                          color={isSelected ? "primary" : "default"}
                          variant={isSelected ? "filled" : "outlined"}
                          disabled={!isAvailable && !isSelected}
                          sx={{ borderRadius: 2, fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
            {selectedVariant && (
              <Typography variant="body2" color="text.secondary">
                {t("common.currency")} {Number(selectedVariant.price).toFixed(2)}
                {Number(selectedVariant.quantity) <= 0 && (
                  <span> · {t("product.outOfStock")}</span>
                )}
              </Typography>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={
            submitting ||
            loading ||
            !selectedVariant ||
            Number(selectedVariant.quantity) <= 0
          }
        >
          {submitting ? (
            <CircularProgress size={18} sx={{ color: "inherit" }} />
          ) : (
            confirmLabel || t("product.addToCart")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
