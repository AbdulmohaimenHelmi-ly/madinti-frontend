"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
  Chip,
  Button,
  InputBase,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TuneIcon from "@mui/icons-material/Tune";
import { useLocale, useTranslations } from "next-intl";
import type { CartItem as CartItemType } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import VariantPickerDialog from "@/components/products/VariantPickerDialog";

interface CartItemProps {
  item: CartItemType;
}

type QtyInputElement = HTMLInputElement | HTMLTextAreaElement;

export default function CartItem({ item }: CartItemProps) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItemVariant = useCartStore((s) => s.updateItemVariant);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const commitQty = (input: QtyInputElement) => {
    const parsed = parseInt(input.value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      input.value = String(item.quantity);
      return;
    }
    if (parsed === item.quantity) {
      input.value = String(item.quantity);
      return;
    }

    updateItem(item.id, parsed);
  };

  const productName =
    item.product && locale === "en" && item.product.name_en
      ? item.product.name_en
      : item.product?.name || "";

  // The cart endpoint serialises the product via ProductListResource, which
  // exposes a single `image` URL (already prefixed) rather than an `images`
  // array. Prefer the variant image first when one is selected.
  const imageSrc =
    item.variant?.image ||
    (item.product as { image?: string | null } | undefined)?.image ||
    item.product?.images?.find((img) => img.is_primary)?.image ||
    item.product?.images?.[0]?.image ||
    "/placeholder-product.svg";

  return (
    <Box>
      <Box
        sx={{
          py: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "72px 1fr", sm: "auto 1fr auto" },
          gridTemplateAreas: {
            xs: `"image info" "actions actions"`,
            sm: `"image info actions"`,
          },
          columnGap: { xs: 1.5, sm: 2 },
          rowGap: { xs: 1.5, sm: 0 },
          alignItems: "center",
        }}
      >
          <Paper
            elevation={0}
            sx={{
              gridArea: "image",
              width: { xs: 72, sm: 90 },
              height: { xs: 72, sm: 90 },
              borderRadius: 2.5,
              overflow: "hidden",
              flexShrink: 0,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Box
              component="img"
              src={imageSrc}
              alt={productName}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                bgcolor: "grey.50",
              }}
            />
          </Paper>

          <Box sx={{ gridArea: "info", flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                display: "-webkit-box",
                overflow: "hidden",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {productName}
            </Typography>
            {item.variant && (item.variant.label || item.variant.options?.length) && (
              <Chip
                size="small"
                variant="outlined"
                onClick={
                  item.product?.has_variants
                    ? () => setVariantDialogOpen(true)
                    : undefined
                }
                deleteIcon={item.product?.has_variants ? <TuneIcon /> : undefined}
                onDelete={
                  item.product?.has_variants
                    ? () => setVariantDialogOpen(true)
                    : undefined
                }
                sx={{ mb: 0.5, height: 22, "& .MuiChip-label": { px: 1, fontSize: "0.72rem" } }}
                label={
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                    {item.variant.options?.find((o) => o.hex_color)?.hex_color && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: item.variant.options.find((o) => o.hex_color)!.hex_color!,
                          border: "1px solid",
                          borderColor: "grey.300",
                        }}
                      />
                    )}
                    <span>
                      {item.variant.label ||
                        item.variant.options
                          .map((o) => {
                            const opt = locale === "en" && o.option_en ? o.option_en : o.option;
                            const val = locale === "en" && o.value_en ? o.value_en : o.value;
                            return `${opt}: ${val}`;
                          })
                          .join(" / ")}
                    </span>
                  </Box>
                }
              />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
              {Number(item.price).toFixed(2)} {t("currency")}
            </Typography>
          </Box>

          <Box
            sx={{
              gridArea: "actions",
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
              justifyContent: { xs: "space-between", sm: "flex-end" },
              width: "100%",
            }}
          >
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 2,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                if (item.quantity <= 1) {
                  removeItem(item.id);
                } else {
                  updateItem(item.id, item.quantity - 1);
                }
              }}
              sx={{ borderRadius: 0 }}
              aria-label={item.quantity <= 1 ? t("remove") : t("decrease")}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <InputBase
              key={`${item.id}:${item.quantity}`}
              defaultValue={String(item.quantity)}
              onChange={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
              }}
              onBlur={(e) => commitQty(e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitQty(e.currentTarget);
                  e.currentTarget.blur();
                }
              }}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                "aria-label": t("quantity"),
                style: { textAlign: "center", padding: 0 },
              }}
              sx={{
                width: 44,
                "& input": {
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  py: 0.5,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => updateItem(item.id, item.quantity + 1)}
              sx={{ borderRadius: 0 }}
              aria-label={t("increase")}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Paper>

          <Typography
            variant="body1"
            sx={{
              minWidth: { xs: "auto", sm: 80 },
              textAlign: "end",
              fontWeight: 800,
              flexShrink: 0,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              color: "primary.main",
            }}
          >
            {(Number(item.price) * item.quantity).toFixed(2)} {t("currency")}
          </Typography>

          <Button
            onClick={() => removeItem(item.id)}
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            sx={{
              flexShrink: 0,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: "none",
              borderWidth: 1.5,
              minWidth: { xs: 40, sm: "auto" },
              px: { xs: 1, sm: 2 },
              "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
              "&:hover": { bgcolor: "error.main", color: "white", borderColor: "error.main" },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("remove")}
            </Box>
          </Button>
          </Box>
      </Box>
      <Divider sx={{ "&:last-of-type": { display: "none" } }} />
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
            setToast({ msg: t("success"), type: "success" });
          } catch (err) {
            const e = err as {
              response?: { data?: { message?: string; errors?: Record<string, string[]> } };
            };
            const msg =
              e?.response?.data?.errors?.product_variant_id?.[0] ||
              e?.response?.data?.message ||
              t("error");
            setToast({ msg, type: "error" });
            throw err;
          }
        }}
      />
      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.type} onClose={() => setToast(null)} sx={{ width: "100%" }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
