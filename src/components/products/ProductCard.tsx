"use client";

import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
  Button,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const name = locale === "en" && product.name_en ? product.name_en : product.name;
  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardMedia
        component={Link}
        href={`/${locale}/products/${product.id}`}
        sx={{
          height: 200,
          bgcolor: "grey.100",
          backgroundSize: "contain",
        }}
        image={primaryImage?.image || "/placeholder-product.png"}
        title={name}
      />
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
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
            mb: 1,
          }}
        >
          {name}
        </Typography>

        {product.vendor && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {locale === "en" && product.vendor.store_name_en
              ? product.vendor.store_name_en
              : product.vendor.store_name}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <Rating value={product.rating} readOnly size="small" precision={0.5} />
          <Typography variant="caption" color="text.secondary">
            ({product.total_reviews})
          </Typography>
        </Box>

        <Box sx={{ mt: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {product.price} {t("currency")}
            </Typography>
            {product.compare_price && product.compare_price > product.price && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textDecoration: "line-through" }}
              >
                {product.compare_price} {t("currency")}
              </Typography>
            )}
          </Box>
          {product.quantity > 0 ? (
            <Chip
              label={t("addToCart")}
              icon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
              color="primary"
              size="small"
              clickable
            />
          ) : (
            <Chip
              label={useTranslations("product")("outOfStock")}
              color="default"
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
