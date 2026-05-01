"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  InputBase,
  IconButton,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Link from "next/link";
import ProductRail from "@/components/products/ProductRail";
import VendorCard from "@/components/vendors/VendorCard";
import { HomePageSkeleton } from "@/components/common/Skeletons";
import HeroMosaic from "@/components/home/HeroMosaic";
import MobileHeroCarousel from "@/components/home/MobileHeroCarousel";
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
        alignItems: "flex-start",
        mb: { xs: 2.5, md: 4 },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontWeight: 800,
            color: "text.primary",
            fontSize: { xs: "1.1rem", md: "1.5rem" },
          }}
        >
          {title}
        </Typography>
        <Box
          sx={(theme) => ({
            width: 36,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            mt: 0.75,
          })}
        />
      </Box>
      <Button
        component={Link}
        href={linkHref}
        endIcon={<ArrowIcon sx={{ fontSize: { xs: "1rem !important", md: "1.25rem !important" } }} />}
        sx={{
          borderRadius: 100,
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 0.5, md: 1 },
          fontSize: { xs: "0.8rem", md: "0.875rem" },
          fontWeight: 600,
          color: "primary.main",
          "&:hover": { bgcolor: "primary.main", color: "white" },
          transition: "all 0.2s ease",
          mt: { xs: 0.25, md: 0 },
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
  const router = useRouter();
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;

  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const { apiParam: contentType } = useContentFilter();
  const requestKey = contentType ?? "__all__";
  const loading = loadedKey !== requestKey;

  const handleSearch = () => {
    const q = searchQuery.trim();
    router.push(`/${locale}/products${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

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
      {/* Content audience switch — desktop only (mobile uses header icon pill) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          mb: { xs: 1, md: 1.5 },
        }}
      >
        <ContentFilterSwitch />
      </Box>

      {/* Mobile search bar — Flutter _SearchBar exact match */}
      <Box
        sx={{ display: { xs: "block", md: "none" }, mt: "8px", mb: "12px" }}
        component="form"
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSearch(); }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "white",
            borderRadius: "16px",
            border: "1px solid #EDE7E9",
            px: "14px",
          }}
        >
          <SearchRoundedIcon sx={{ color: "#6B6B6B", fontSize: 24, flexShrink: 0 }} />
          <InputBase
            placeholder={t("common.searchHint")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ "aria-label": t("common.search") }}
            fullWidth
            sx={{ py: "14px", px: "10px", fontSize: "0.844rem", color: "#1A1A1A",
              "& ::placeholder": { color: "#6B6B6B", opacity: 1 } }}
          />
          <IconButton
            onClick={() => router.push(`/${locale}/products`)}
            aria-label={t("common.search")}
            sx={{ color: "#6B6B6B", flexShrink: 0, p: "8px", mr: "-8px" }}
          >
            <TuneRoundedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── MOBILE: Flutter-style swipeable carousel (xs/sm only) ── */}
      {(categories.length > 0 || banners.length > 0) && (
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <MobileHeroCarousel banners={banners} categories={categories} />
        </Box>
      )}

      {/* ── DESKTOP: three-column mosaic with side tiles (md+) ── */}
      {(categories.length > 0 || banners.length > 0) && (
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <HeroMosaic
            categories={categories}
            brands={brands}
            banners={banners}
          />
        </Box>
      )}

      {/* Circular categories carousel */}
      {categories.length > 0 && (
        <Box>
          <Box sx={{ px: { xs: 2, md: 5 }, mb: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.1rem", md: "1.5rem" },
              }}
            >
              {t("home.topCategories")}
            </Typography>
            <Box
              sx={(theme) => ({
                width: 36,
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                mt: 0.75,
              })}
            />
          </Box>
          <CategoriesCarousel categories={categories} />
        </Box>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <Box sx={{ mb: { xs: 5, md: 10 }, px: { xs: 2, md: 5 } }}>
          <SectionHeader
            title={t("home.featuredProducts")}
            linkText={t("common.viewAll")}
            linkHref={`/${locale}/products`}
            ArrowIcon={ArrowIcon}
          />
          <ProductRail products={featured.slice(0, 8)} />
        </Box>
      )}

      {/* For You — personalised recommendations */}
      <ForYouSection contentType={contentType ?? undefined} />

      {/* Top Vendors */}
      {vendors.length > 0 && (
        <Box sx={{ mb: { xs: 5, md: 10 }, px: { xs: 2, md: 5 } }}>
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
