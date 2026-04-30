"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import VendorCard from "@/components/vendors/VendorCard";
import { HomePageSkeleton } from "@/components/common/Skeletons";
import HeroMosaic from "@/components/home/HeroMosaic";
import CategoriesCarousel from "@/components/home/CategoriesCarousel";
import ForYouSection from "@/components/home/ForYouSection";
import type { Product, Category, Vendor, Brand, Banner } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { vendorsApi } from "@/lib/api/vendors";
import { brandsApi } from "@/lib/api/brands";
import { bannersApi } from "@/lib/api/banners";
import { useContentFilter } from "@/lib/context/ContentFilterContext";
import ContentFilterSwitch from "@/components/common/ContentFilterSwitch";

function SectionHeader({
  title,
  linkText,
  linkHref,
  ArrowIcon,
}: {
  title: string;
  linkText: string;
  linkHref: string;
  ArrowIcon: typeof ArrowForwardIcon;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        mb: { xs: 2.5, md: 4 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={(theme) => ({
            width: 48,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            mt: 1,
          })}
        />
      </Box>
      <Button
        component={Link}
        href={linkHref}
        endIcon={<ArrowIcon />}
        size="small"
        sx={{
          borderRadius: 100,
          px: { xs: 1.5, md: 2.5 },
          fontWeight: 600,
          fontSize: { xs: "0.78rem", md: "0.875rem" },
          flexShrink: 0,
          color: "primary.main",
          "&:hover": { bgcolor: "primary.main", color: "white" },
          transition: "all 0.2s ease",
        }}
      >
        {linkText}
      </Button>
    </Box>
  );
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;

  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const { apiParam: contentType } = useContentFilter();
  const requestKey = contentType ?? "__all__";
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const baseParams: Record<string, string | number> = {};
    if (contentType) baseParams.content_type = contentType;

    Promise.all([
      productsApi
        .getFeatured(baseParams)
        .catch(() => ({ data: { data: [] } })),
      categoriesApi.getAll(baseParams).catch(() => ({ data: { data: [] } })),
      vendorsApi.getAll({ per_page: 4 }).catch(() => ({ data: { data: [] } })),
      brandsApi
        .getAll({ is_featured: 1, per_page: 6, ...baseParams })
        .catch(() => ({ data: { data: [] } })),
      bannersApi
        .getAll({ is_active: 1, ...baseParams })
        .catch(() => ({ data: { data: [] } })),
    ]).then(([featuredRes, categoriesRes, vendorsRes, brandsRes, bannersRes]) => {
      if (cancelled) return;

      setFeatured(featuredRes.data.data);
      setCategories(categoriesRes.data.data);
      setVendors(vendorsRes.data.data);
      setBrands(brandsRes.data.data);
      setBanners(bannersRes.data.data);
      setLoadedKey(requestKey);
    });

    return () => {
      cancelled = true;
    };
  }, [contentType, requestKey]);

  if (loading) return <HomePageSkeleton />;

  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 1680,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 },
      }}
    >
      {/* Content audience switch */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: { xs: 1, md: 1.5 },
        }}
      >
        <ContentFilterSwitch />
      </Box>

      {/* Mosaic Hero: slider + side tiles */}
      {(categories.length > 0 || banners.length > 0) && (
        <HeroMosaic
          categories={categories}
          brands={brands}
          banners={banners}
        />
      )}

      {/* Circular categories carousel */}
      {categories.length > 0 && (
        <Box>
          <Box sx={{ px: { xs: 1, md: 5 }, mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {t("home.topCategories")}
            </Typography>
            <Box
              sx={(theme) => ({
                width: 48,
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                mt: 1,
              })}
            />
          </Box>
          <CategoriesCarousel categories={categories} />
        </Box>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <Box sx={{ mb: { xs: 5, md: 10 }, px: { xs: 1, md: 5 } }}>
          <SectionHeader
            title={t("home.featuredProducts")}
            linkText={t("common.viewAll")}
            linkHref={`/${locale}/products`}
            ArrowIcon={ArrowIcon}
          />
          <ProductGrid products={featured.slice(0, 8)} />
        </Box>
      )}

      {/* For You — personalised recommendations */}
      <ForYouSection contentType={contentType ?? undefined} />

      {/* Top Vendors */}
      {vendors.length > 0 && (
        <Box sx={{ mb: { xs: 5, md: 10 }, px: { xs: 1, md: 5 } }}>
          <SectionHeader
            title={t("home.topVendors")}
            linkText={t("common.viewAll")}
            linkHref={`/${locale}/vendors`}
            ArrowIcon={ArrowIcon}
          />
          <Grid container spacing={3}>
            {vendors.slice(0, 4).map((vendor) => (
              <Grid key={vendor.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <VendorCard vendor={vendor} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
