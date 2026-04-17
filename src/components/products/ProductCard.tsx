"use client";

import { Box, IconButton, Typography } from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

/**
 * Shein-style product card:
 * - Flat, no border/shadow, square full-bleed image with object-cover
 * - Small discount pill overlay on the image (top-start corner)
 * - Inline `-xx%` red pill + product name on one line below the image
 * - Big red price, strike-through compare price, small sold count
 * - Circular outline cart button on the trailing side
 */
export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const name = locale === "en" && product.name_en ? product.name_en : product.name;

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageSrc =
    primaryImage?.image ||
    (product as unknown as { image?: string }).image ||
    "/placeholder-product.png";

  const hasDiscount =
    !!product.compare_price && product.compare_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) *
          100,
      )
    : 0;

  // Approximate "sold" count so the card feels populated like Shein.
  const soldCount = Math.max(product.total_reviews * 37, 0);
  const soldLabel =
    soldCount >= 1000
      ? `${(soldCount / 1000).toFixed(1).replace(/\.0$/, "")}k+ ${pt("sold")}`
      : soldCount > 0
        ? `${soldCount}+ ${pt("sold")}`
        : "";

  const outOfStock = product.quantity <= 0;

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "transparent",
        "&:hover .product-image-img": {
          transform: "scale(1.04)",
        },
        "&:hover .product-card-cart": {
          bgcolor: "primary.main",
          color: "white",
          borderColor: "primary.main",
        },
      }}
    >
      {/* Image */}
      <Box
        component={Link}
        href={`/${locale}/products/${product.id}`}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          // Shein uses a portrait 3:4 image (taller than wide).
          aspectRatio: "3 / 4",
          overflow: "hidden",
          bgcolor: "grey.100",
          borderRadius: 1,
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt={name}
          loading="lazy"
          className="product-image-img"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Discount pill */}
        {hasDiscount && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineStart: 8,
              bgcolor: "#ff3b30",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: 700,
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              lineHeight: 1.2,
              letterSpacing: 0.2,
            }}
          >
            -{discountPercent}%
          </Box>
        )}

        {/* Featured badge */}
        {product.is_featured && !hasDiscount && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineStart: 8,
              bgcolor: "#16a34a",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: 700,
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {pt("featured")}
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
              color: "text.primary",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {pt("outOfStock")}
          </Box>
        )}
      </Box>

      {/* Meta */}
      <Box sx={{ pt: 1, px: 0.25, display: "flex", flexDirection: "column", gap: 0.5, flexGrow: 1 }}>
        {/* Inline -xx% pill + name (single line with ellipsis) */}
        <Box
          component={Link}
          href={`/${locale}/products/${product.id}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            textDecoration: "none",
            color: "text.primary",
          }}
        >
          {hasDiscount && (
            <Box
              component="span"
              sx={{
                flexShrink: 0,
                bgcolor: "#fee2e2",
                color: "#dc2626",
                fontSize: "0.7rem",
                fontWeight: 700,
                px: 0.6,
                py: 0.15,
                borderRadius: 0.5,
                lineHeight: 1.3,
              }}
            >
              -{discountPercent}%
            </Box>
          )}
          <Typography
            component="span"
            sx={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {name}
          </Typography>
        </Box>

        {/* Bestseller ribbon for featured */}
        {product.is_featured && (
          <Box
            sx={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "#fef3c7",
              color: "#92400e",
              fontSize: "0.7rem",
              fontWeight: 700,
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {pt("featured")}
          </Box>
        )}

        {/* Rating */}
        {product.total_reviews > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <StarRoundedIcon sx={{ fontSize: 15, color: "#f59e0b" }} />
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 600 }}>
              {product.rating.toFixed(1)}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
              ({product.total_reviews}
              {product.total_reviews >= 100 ? "+" : ""})
            </Typography>
          </Box>
        )}

        {/* Price row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mt: "auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, minWidth: 0, flexWrap: "wrap" }}>
            <Typography
              component="span"
              sx={{
                color: "#ff3b30",
                fontWeight: 800,
                fontSize: "1rem",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {t("currency")} {Number(product.price).toFixed(2)}
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
                {Number(product.compare_price).toFixed(2)}
              </Typography>
            )}
            {soldLabel && (
              <Typography
                component="span"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.72rem",
                  whiteSpace: "nowrap",
                }}
              >
                {soldLabel}
              </Typography>
            )}
          </Box>

          {!outOfStock && (
            <IconButton
              className="product-card-cart"
              aria-label={t("addToCart")}
              size="small"
              sx={{
                flexShrink: 0,
                width: 30,
                height: 30,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "white",
                color: "text.primary",
                transition: "all 0.2s ease",
                // Flip the cart icon in RTL so it points consistently.
                "& svg": { transform: isRtl ? "scaleX(-1)" : "none" },
              }}
            >
              <ShoppingCartOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}
