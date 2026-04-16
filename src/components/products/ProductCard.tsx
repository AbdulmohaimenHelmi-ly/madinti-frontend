"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const pt = useTranslations("product");
  const locale = useLocale();
  const name = locale === "en" && product.name_en ? product.name_en : product.name;
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
    : 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          "& .product-image": {
            transform: "scale(1.05)",
          },
        },
      }}
    >
      <Box
        component={Link}
        href={`/${locale}/products/${product.id}`}
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "grey.50",
        }}
      >
        <CardMedia
          className="product-image"
          sx={{
            height: 220,
            backgroundSize: "contain",
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          image={primaryImage?.image || "/placeholder-product.png"}
          title={name}
        />
        {hasDiscount && (
          <Chip
            icon={<LocalOfferIcon sx={{ fontSize: 14 }} />}
            label={`-${discountPercent}%`}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              bgcolor: "secondary.main",
              color: "white",
              fontWeight: 700,
              fontSize: "0.75rem",
              "& .MuiChip-icon": { color: "white" },
            }}
          />
        )}
        {product.is_featured && (
          <Chip
            label="★"
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: "#FFC107",
              color: "#5D4037",
              fontWeight: 700,
              minWidth: 28,
            }}
          />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2.5 }}>
        <Typography
          variant="body1"
          component={Link}
          href={`/${locale}/products/${product.id}`}
          sx={{
            fontWeight: 600,
            textDecoration: "none",
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            mb: 0.5,
            lineHeight: 1.4,
            "&:hover": { color: "primary.main" },
            transition: "color 0.2s ease",
          }}
        >
          {name}
        </Typography>

        {product.vendor && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
            {locale === "en" && product.vendor.store_name_en
              ? product.vendor.store_name_en
              : product.vendor.store_name}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
          <Rating value={product.rating} readOnly size="small" precision={0.5} />
          <Typography variant="caption" color="text.secondary">
            ({product.total_reviews})
          </Typography>
        </Box>

        <Box sx={{ mt: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                fontSize: "1.1rem",
                lineHeight: 1.2,
              }}
            >
              {product.price} {t("currency")}
            </Typography>
            {hasDiscount && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ textDecoration: "line-through", lineHeight: 1 }}
              >
                {product.compare_price} {t("currency")}
              </Typography>
            )}
          </Box>
          {product.quantity > 0 ? (
            <Chip
              label={t("addToCart")}
              icon={<ShoppingCartIcon sx={{ fontSize: 15 }} />}
              color="primary"
              size="small"
              clickable
              sx={{
                fontWeight: 600,
                pl: 0.5,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(255, 183, 68, 0.3)",
                },
              }}
            />
          ) : (
            <Chip
              label={pt("outOfStock")}
              size="small"
              variant="outlined"
              sx={{ opacity: 0.6 }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
