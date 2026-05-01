"use client";

/**
 * ProductRailCard — compact card for the horizontal mobile rail.
 *
 * Matches Flutter ProductCard exactly:
 *   - White card, borderRadius 18, border (#EDE7E9)
 *   - AspectRatio(1) square image  →  1:1 on web
 *   - Discount badge top-start inside image
 *   - Favorite button top-end inside image (white circle)
 *   - Primary cart button bottom-end inside image (filled circle)
 *   - Name (2 lines, ellipsis) + price row below
 */

import { useState } from "react";
import { Box, CircularProgress, IconButton, Typography, Snackbar, Alert } from "@mui/material";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import FavoriteButton from "./FavoriteButton";
import VariantPickerDialog from "./VariantPickerDialog";

export default function ProductRailCard({ product }: { product: Product }) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const router = useRouter();
  const name = locale === "en" && product.name_en ? product.name_en : product.name;

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

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
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (product.has_variants) {
      setVariantDialogOpen(true);
      return;
    }
    setAdding(true);
    try {
      await addItem(product.id, 1, null);
      setToast({ msg: pt("addedToCart"), type: "success" });
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setToast({ msg: e2.response?.data?.message ?? t("error"), type: "error" });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "white",
        borderRadius: "18px",
        border: "1px solid #EDE7E9",
        overflow: "hidden",
      }}
    >
      {/* Square image */}
      <Box
        component={Link}
        href={`/${locale}/products/${product.id}`}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          aspectRatio: "1 / 1",
          bgcolor: "#F5F0F2",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={name}
          loading="lazy"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Discount badge — top start */}
        {hasDiscount && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineStart: 8,
              bgcolor: "secondary.main",
              color: "white",
              fontSize: "0.68rem",
              fontWeight: 800,
              px: 0.75,
              py: 0.35,
              borderRadius: "8px",
              lineHeight: 1.2,
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            }}
          >
            -{discountPercent}%
          </Box>
        )}

        {/* Favorite — top end, white circle */}
        <Box
          sx={{
            position: "absolute",
            top: 6,
            insetInlineEnd: 6,
            zIndex: 2,
          }}
        >
          <FavoriteButton productId={product.id} size="small" />
        </Box>

        {/* Cart button — bottom end, filled primary circle */}
        {!outOfStock && (
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              insetInlineEnd: 6,
              zIndex: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={handleAddToCart}
              disabled={adding}
              aria-label={t("addToCart")}
              sx={{
                width: 34,
                height: 34,
                bgcolor: "primary.main",
                color: "white",
                boxShadow: 2,
                "&:hover": { bgcolor: "primary.dark" },
                "&:disabled": { bgcolor: "primary.main", opacity: 0.7 },
              }}
            >
              {adding ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <AddShoppingCartRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        )}

        {/* Out of stock veil */}
        {outOfStock && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "text.primary",
            }}
          >
            {pt("outOfStock")}
          </Box>
        )}
      </Box>

      {/* Text section */}
      <Box
        sx={{
          px: "10px",
          pt: "10px",
          pb: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {/* Name — 2 lines max */}
        <Typography
          component={Link}
          href={`/${locale}/products/${product.id}`}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: "0.82rem",
            fontWeight: 600,
            lineHeight: 1.25,
            color: "text.primary",
            textDecoration: "none",
          }}
        >
          {name}
        </Typography>

        {/* Rating */}
        {totalReviews > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <StarRoundedIcon sx={{ fontSize: 13, color: "#FFB300" }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.primary" }}>
              {rating.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
              ({totalReviews})
            </Typography>
          </Box>
        )}

        {/* Price */}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
          <Typography
            component="span"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              fontSize: "0.95rem",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {price.toFixed(2)} {t("currency")}
          </Typography>
          {hasDiscount && (
            <Typography
              component="span"
              sx={{
                color: "text.disabled",
                fontSize: "0.72rem",
                textDecoration: "line-through",
                whiteSpace: "nowrap",
              }}
            >
              {comparePrice!.toFixed(2)}
            </Typography>
          )}
        </Box>
      </Box>

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

      <VariantPickerDialog
        open={variantDialogOpen}
        productId={product.id}
        onClose={() => setVariantDialogOpen(false)}
        onConfirm={async (variantId) => {
          await addItem(product.id, 1, variantId);
          setToast({ msg: pt("addedToCart"), type: "success" });
        }}
        confirmLabel={t("addToCart")}
      />
    </Box>
  );
}
