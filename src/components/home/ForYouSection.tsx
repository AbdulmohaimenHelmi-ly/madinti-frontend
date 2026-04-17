"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box, Button, Typography, Skeleton } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/types";

interface ForYouSectionProps {
  contentType?: string;
}

/**
 * "For You" rail.
 *
 * Hits /products/for-you which runs a server-side hybrid recommender:
 *   - per-user affinity (recent views + orders) weighted by category/brand/vendor
 *   - global popularity (views + orders, 30-day window)
 *   - quality (rating × review confidence)
 *   - a small freshness & featured bonus
 * Falls back to trending for guests / cold-start users, so this rail always
 * has content regardless of login state.
 */
export default function ForYouSection({ contentType }: ForYouSectionProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string | number> = { per_page: 12 };
    if (contentType) params.content_type = contentType;

    productsApi
      .getForYou(params)
      .then((res) => {
        if (!cancelled) setProducts(res.data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contentType]);

  if (!loading && products.length === 0) return null;

  return (
    <Box sx={{ mb: 10, px: { xs: 1, md: 5 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: 26,
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
              {t("home.forYou")}
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              width: 48,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              mt: 1,
            })}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontSize: "0.85rem" }}
          >
            {t("home.forYouSubtitle")}
          </Typography>
        </Box>

        <Button
          component={Link}
          href={`/${locale}/products`}
          endIcon={<ArrowIcon />}
          sx={{
            borderRadius: 100,
            px: 2.5,
            fontWeight: 600,
            color: "primary.main",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "primary.main", color: "white" },
            transition: "all 0.2s ease",
          }}
        >
          {t("common.viewAll")}
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i}>
              <Skeleton
                variant="rectangular"
                sx={{ width: "100%", aspectRatio: "3 / 4", borderRadius: 1 }}
              />
              <Skeleton width="80%" sx={{ mt: 1 }} />
              <Skeleton width="50%" />
            </Box>
          ))}
        </Box>
      ) : (
        <ProductGrid products={products} />
      )}
    </Box>
  );
}
