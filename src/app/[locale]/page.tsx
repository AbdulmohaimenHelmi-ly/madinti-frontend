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
import LocalMallIcon from "@mui/icons-material/LocalMall";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import CategoryCard from "@/components/categories/CategoryCard";
import VendorCard from "@/components/vendors/VendorCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Product, Category, Vendor } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { vendorsApi } from "@/lib/api/vendors";

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
        mb: 4,
      }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
          {title}
        </Typography>
        <Box
          sx={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #FFB744, #FFCC80)",
            mt: 1,
          }}
        />
      </Box>
      <Button
        component={Link}
        href={linkHref}
        endIcon={<ArrowIcon />}
        sx={{
          borderRadius: 100,
          px: 2.5,
          fontWeight: 600,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.getFeatured().catch(() => ({ data: { data: [] } })),
      categoriesApi.getAll().catch(() => ({ data: { data: [] } })),
      vendorsApi.getAll({ per_page: 4 }).catch(() => ({ data: { data: [] } })),
    ]).then(([featuredRes, categoriesRes, vendorsRes]) => {
      setFeatured(featuredRes.data.data);
      setCategories(categoriesRes.data.data);
      setVendors(vendorsRes.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          background: "linear-gradient(135deg, #FFB744 0%, #E6A33E 30%, #FFCC80 60%, #FFB744 100%)",
          color: "white",
          py: { xs: 8, md: 12 },
          mb: 8,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            right: isRtl ? "auto" : "-10%",
            left: isRtl ? "-10%" : "auto",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-30%",
            right: isRtl ? "auto" : "20%",
            left: isRtl ? "20%" : "auto",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="h2"
                gutterBottom
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "2.2rem", sm: "2.8rem", md: "3.5rem" },
                  lineHeight: 1.15,
                  textShadow: "0 2px 20px rgba(0,0,0,0.1)",
                }}
              >
                {t("home.hero")}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  mb: 5,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 500,
                  fontSize: { xs: "1rem", md: "1.15rem" },
                }}
              >
                {t("home.heroSubtitle")}
              </Typography>
              <Button
                component={Link}
                href={`/${locale}/products`}
                variant="contained"
                size="large"
                startIcon={<LocalMallIcon />}
                endIcon={<ArrowIcon />}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  fontWeight: 700,
                  fontSize: "1rem",
                  px: 4,
                  py: 1.5,
                  borderRadius: 100,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "white",
                    boxShadow: "0 6px 30px rgba(0,0,0,0.25)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {t("home.shopNow")}
              </Button>
            </Grid>
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}
            >
              <Box
                sx={{
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,255,255,0.1)",
                }}
              >
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <LocalMallIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Top Categories */}
        {categories.length > 0 && (
          <Box sx={{ mb: 10 }}>
            <SectionHeader
              title={t("home.topCategories")}
              linkText={t("common.viewAll")}
              linkHref={`/${locale}/categories`}
              ArrowIcon={ArrowIcon}
            />
            <Box
              sx={{
                display: "flex",
                gap: 3,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {categories.slice(0, 6).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </Box>
          </Box>
        )}

        {/* Featured Products */}
        {featured.length > 0 && (
          <Box sx={{ mb: 10 }}>
            <SectionHeader
              title={t("home.featuredProducts")}
              linkText={t("common.viewAll")}
              linkHref={`/${locale}/products`}
              ArrowIcon={ArrowIcon}
            />
            <ProductGrid products={featured.slice(0, 8)} />
          </Box>
        )}

        {/* Top Vendors */}
        {vendors.length > 0 && (
          <Box sx={{ mb: 10 }}>
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
    </>
  );
}
