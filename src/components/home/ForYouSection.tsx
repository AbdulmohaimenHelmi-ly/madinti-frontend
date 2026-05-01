"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box, Button, Typography } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import ProductRail from "@/components/products/ProductRail";
import { productsApi } from "@/lib/api/products";
import { withProductContentType } from "@/lib/products/contentTypeLink";
import type { Product } from "@/lib/types";

interface ForYouSectionProps {
  contentType?: "male" | "female";
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
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const productsHref = withProductContentType(`/${locale}/products`, contentType);
  const requestKey = contentType ?? "__all__";
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    const params: Record<string, string | number> = { per_page: 12 };
    if (contentType) params.content_type = contentType;

    productsApi
      .getForYou(params)
      .then((res) => {
        if (cancelled) return;

        setProducts(res.data.data ?? []);
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (cancelled) return;

        setProducts([]);
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [contentType, requestKey]);

  if (!loading && products.length === 0) return null;

  return (
    <Box sx={{ mb: { xs: 5, md: 10 }, px: { xs: 2, md: 5 } }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: 22,
              }}
            />
            <Typography sx={{ fontWeight: 800, fontSize: "1.125rem", color: "text.primary", lineHeight: 1.2 }}>
              {t("home.forYou")}
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              width: 36,
              height: 3,
              borderRadius: 1,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              mt: "6px",
              mb: "6px",
            })}
          />
          <Typography
            sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.4 }}
          >
            {t("home.forYouSubtitle")}
          </Typography>
        </Box>

        <Button
          component={Link}
          href={productsHref}
          endIcon={<ArrowIcon />}
          sx={{
            borderRadius: 100,
            px: 1.5,
            fontWeight: 600,
            color: "primary.main",
            whiteSpace: "nowrap",
            fontSize: "0.875rem",
            "&:hover": { bgcolor: "primary.main", color: "white" },
            transition: "all 0.2s ease",
          }}
        >
          {t("common.viewAll")}
        </Button>
      </Box>

      {loading ? (
        <ProductRail products={[]} loading skeletonCount={6} />
      ) : (
        <ProductRail products={products} />
      )}
    </Box>
  );
}
