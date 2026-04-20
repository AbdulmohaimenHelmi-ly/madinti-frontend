"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Rating,
  Divider,
  IconButton,
  TextField,
  Paper,
  Tooltip,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CheckIcon from "@mui/icons-material/Check";
import { useLocale, useTranslations } from "next-intl";
import type { Product, ProductOption, ProductOptionValue, ProductVariant } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";

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
  const description =
    locale === "en" && product.description_en
      ? product.description_en
      : product.description;

  const hasVariants = !!product.has_variants;
  const options: ProductOption[] = useMemo(
    () => (product.options || []).slice().sort((a, b) => a.position - b.position),
    [product.options]
  );
  const variants: ProductVariant[] = useMemo(
    () => (product.variants || []).filter((v) => v.is_active),
    [product.variants]
  );

  // Auto-select a default variant on mount when the product has variants so
  // the price/stock reflects a real variant instead of the legacy base price.
  // Prefer the first in-stock variant, otherwise fall back to the first active one.
  useEffect(() => {
    if (!hasVariants || variants.length === 0 || options.length === 0) return;
    if (Object.keys(selection).length > 0) return;
    const defaultVariant =
      variants.find((v) => v.is_default) ||
      variants.find((v) => Number(v.quantity) > 0) ||
      variants[0];
    if (!defaultVariant) return;
    const picks: Record<number, number> = {};
    for (const opt of options) {
      const valId = defaultVariant.option_value_ids.find((id) =>
        opt.values.some((vv) => vv.id === id)
      );
      if (valId) picks[opt.id] = valId;
    }
    if (Object.keys(picks).length > 0) setSelection(picks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, hasVariants]);

  const allOptionsPicked =
    options.length > 0 && options.every((o) => selection[o.id]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasVariants || !allOptionsPicked) return null;
    const picked = new Set(Object.values(selection));
    return (
      variants.find(
        (v) =>
          v.option_value_ids.length === picked.size &&
          v.option_value_ids.every((id) => picked.has(id))
      ) || null
    );
  }, [hasVariants, allOptionsPicked, selection, variants]);

  // Map of "available" value ids per option, considering the OTHER selections.
  const availableValueIds = useMemo<Record<number, Set<number>>>(() => {
    const result: Record<number, Set<number>> = {};
    if (!hasVariants) return result;
    for (const opt of options) {
      const otherPicks = Object.entries(selection)
        .filter(([oid]) => Number(oid) !== opt.id)
        .map(([, vid]) => vid);
      const set = new Set<number>();
      for (const v of variants) {
        if (v.quantity <= 0) continue;
        const matches = otherPicks.every((vid) => v.option_value_ids.includes(vid));
        if (matches) {
          for (const vid of v.option_value_ids) {
            // Only add ids that belong to this option
            if (opt.values.some((ov) => ov.id === vid)) set.add(vid);
          }
        }
      }
      result[opt.id] = set;
    }
    return result;
  }, [hasVariants, options, variants, selection]);

  // Laravel serialises decimal casts as strings — coerce before any math.
  const basePrice = Number(product.price) || 0;
  const effectivePrice = hasVariants && selectedVariant
    ? Number(selectedVariant.price) || 0
    : basePrice;
  const effectiveStock = hasVariants
    ? selectedVariant
      ? Number(selectedVariant.quantity) || 0
      : 0
    : product.quantity;
  const comparePrice =
    hasVariants && selectedVariant && selectedVariant.compare_price != null
      ? Number(selectedVariant.compare_price)
      : product.compare_price != null
        ? Number(product.compare_price)
        : null;
  const hasDiscount = comparePrice !== null && comparePrice > effectivePrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice! - effectivePrice) / comparePrice!) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      setVariantError(t("product.pleaseSelectVariant"));
      return;
    }
    setVariantError("");
    setAddSuccess(false);
    try {
      await addItem(product.id, quantity, selectedVariant ? selectedVariant.id : null);
      setAddSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg =
        err?.response?.data?.errors?.variant_id?.[0] ||
        err?.response?.data?.errors?.quantity?.[0] ||
        err?.response?.data?.message ||
        t("common.error");
      setVariantError(msg);
    }
  };

  const optionLabel = (o: ProductOption) =>
    locale === "en" && o.name_en ? o.name_en : o.name;
  const valueLabel = (v: ProductOptionValue) =>
    locale === "en" && v.value_en ? v.value_en : v.value;
  const isColorOption = (o: ProductOption) =>
    o.values.some((v) => !!v.hex_color);

  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          elevation={0}
          sx={{
            bgcolor: "grey.50",
            borderRadius: 4,
            overflow: "hidden",
            mb: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Box
            component="img"
            src={
              selectedVariant?.image ||
              product.images?.[selectedImage]?.image ||
              "/placeholder-product.svg"
            }
            alt={name}
            sx={{
              width: "100%",
              height: 450,
              objectFit: "contain",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.03)" },
            }}
          />
        </Paper>
        {product.images && product.images.length > 1 && (
          <Box sx={{ display: "flex", gap: 1.5, overflow: "auto", pb: 1 }}>
            {product.images.map((img, idx) => (
              <Paper
                key={img.id}
                elevation={0}
                onClick={() => setSelectedImage(idx)}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: idx === selectedImage ? "primary.main" : "grey.200",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  opacity: idx === selectedImage ? 1 : 0.7,
                  "&:hover": { opacity: 1, borderColor: "primary.light" },
                }}
              >
                <Box
                  component="img"
                  src={img.image}
                  alt=""
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Paper>
            ))}
          </Box>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          {name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Rating value={Number(product.rating) || 0} readOnly precision={0.5} size="large" />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            ({product.total_reviews} {t("product.reviews")})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2 }}>
          <Typography
            variant="h3"
            sx={(theme) => ({
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            })}
          >
            {effectivePrice.toFixed(2)} {t("common.currency")}
          </Typography>
          {hasDiscount && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="h6"
                color="text.disabled"
                sx={{ textDecoration: "line-through" }}
              >
                {comparePrice!.toFixed(2)} {t("common.currency")}
              </Typography>
              <Chip
                label={`-${discountPercent}%`}
                size="small"
                sx={{ bgcolor: "secondary.main", color: "white", fontWeight: 700 }}
              />
            </Box>
          )}
        </Box>

        <Chip
          label={effectiveStock > 0 ? t("product.inStock") : t("product.outOfStock")}
          color={effectiveStock > 0 ? "success" : "error"}
          size="small"
          variant="outlined"
          sx={{ mb: 3, fontWeight: 600 }}
        />

        <Divider sx={{ mb: 3 }} />

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.9 }}>
          {description}
        </Typography>

        {product.vendor && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <StorefrontIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {t("product.vendor")}:{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                {locale === "en" && product.vendor.store_name_en
                  ? product.vendor.store_name_en
                  : product.vendor.store_name}
              </Box>
            </Typography>
          </Box>
        )}

        {product.sku && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("product.sku")}: <Box component="span" sx={{ fontWeight: 500 }}>{product.sku}</Box>
          </Typography>
        )}

        <Divider sx={{ mb: 3 }} />

        {hasVariants && (
          <Box sx={{ mb: 3 }}>
            {options.map((opt) => {
              const colorMode = isColorOption(opt);
              const available = availableValueIds[opt.id] || new Set<number>();
              const pickedValueId = selection[opt.id];
              const pickedValue = opt.values.find((v) => v.id === pickedValueId);
              return (
                <Box key={opt.id} sx={{ mb: 2.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.2 }}>
                    {optionLabel(opt)}
                    {pickedValue && (
                      <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, ml: 1 }}>
                        — {valueLabel(pickedValue)}
                      </Box>
                    )}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {opt.values
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((val) => {
                        const isSelected = pickedValueId === val.id;
                        const isAvailable = available.has(val.id);
                        if (colorMode) {
                          return (
                            <Tooltip key={val.id} title={valueLabel(val)}>
                              <Box
                                component="button"
                                onClick={() => {
                                  if (!isAvailable) return;
                                  setSelection((s) => ({ ...s, [opt.id]: val.id }));
                                  setVariantError("");
                                }}
                                sx={{
                                  all: "unset",
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  bgcolor: val.hex_color || "grey.400",
                                  cursor: isAvailable ? "pointer" : "not-allowed",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  border: "2px solid",
                                  borderColor: isSelected ? "primary.main" : "grey.300",
                                  outline: isSelected ? "2px solid" : "none",
                                  outlineColor: "primary.light",
                                  outlineOffset: 2,
                                  opacity: isAvailable ? 1 : 0.35,
                                  transition: "all 0.15s ease",
                                  "&:hover": { borderColor: isAvailable ? "primary.main" : "grey.300" },
                                }}
                              >
                                {isSelected && <CheckIcon fontSize="small" />}
                              </Box>
                            </Tooltip>
                          );
                        }
                        return (
                          <Button
                            key={val.id}
                            size="small"
                            disabled={!isAvailable}
                            variant={isSelected ? "contained" : "outlined"}
                            onClick={() => {
                              setSelection((s) => ({ ...s, [opt.id]: val.id }));
                              setVariantError("");
                            }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                          >
                            {valueLabel(val)}
                          </Button>
                        );
                      })}
                  </Box>
                </Box>
              );
            })}
            {variantError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {variantError}
              </Alert>
            )}
          </Box>
        )}

        {effectiveStock > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {t("common.quantity")}:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid",
                borderColor: "grey.300",
                borderRadius: 2.5,
                overflow: "hidden",
              }}
            >
              <IconButton
                size="small"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                sx={{ borderRadius: 0, px: 1.5 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <TextField
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= effectiveStock) setQuantity(val);
                }}
                size="small"
                sx={{
                  width: 56,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    "& fieldset": { border: "none" },
                  },
                }}
                slotProps={{ htmlInput: { style: { textAlign: "center", fontWeight: 700 } } }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  setQuantity((q) => Math.min(effectiveStock, q + 1))
                }
                sx={{ borderRadius: 0, px: 1.5 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Box>
        )}

        {variantError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVariantError("")}>
            {variantError}
          </Alert>
        )}
        {addSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAddSuccess(false)}>
            {t("product.addedToCart")}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={effectiveStock === 0}
          fullWidth
          sx={{
            py: 1.8,
            borderRadius: 3,
            fontSize: "1.05rem",
            fontWeight: 700,
          }}
        >
          {t("common.addToCart")}
        </Button>
      </Grid>
    </Grid>
  );
}
