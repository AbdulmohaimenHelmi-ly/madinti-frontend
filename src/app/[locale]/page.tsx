"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import ProductGrid from "@/components/products/ProductGrid";
import CategoryCard from "@/components/categories/CategoryCard";
import VendorCard from "@/components/vendors/VendorCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import type { Product, Category, Vendor } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { vendorsApi } from "@/lib/api/vendors";

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
      <Paper
        elevation={0}
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: { xs: 6, md: 10 },
          mb: 6,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
              {t("home.hero")}
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              {t("home.heroSubtitle")}
            </Typography>
            <Button
              component={Link}
              href={`/${locale}/products`}
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "primary.main",
                "&:hover": { bgcolor: "grey.100" },
                px: 4,
                py: 1.5,
              }}
              endIcon={<ArrowIcon />}
            >
              {t("home.shopNow")}
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        {/* Featured Products */}
        {featured.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t("home.featuredProducts")}
              </Typography>
              <Button
                component={Link}
                href={`/${locale}/products`}
                endIcon={<ArrowIcon />}
              >
                {t("common.viewAll")}
              </Button>
            </Box>
            <ProductGrid products={featured.slice(0, 8)} />
          </Box>
        )}

        {/* Top Categories */}
        {categories.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t("home.topCategories")}
              </Typography>
              <Button
                component={Link}
                href={`/${locale}/categories`}
                endIcon={<ArrowIcon />}
              >
                {t("common.viewAll")}
              </Button>
            </Box>
            <Grid container spacing={3}>
              {categories.slice(0, 6).map((category) => (
                <Grid key={category.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <CategoryCard category={category} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Top Vendors */}
        {vendors.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t("home.topVendors")}
              </Typography>
              <Button
                component={Link}
                href={`/${locale}/vendors`}
                endIcon={<ArrowIcon />}
              >
                {t("common.viewAll")}
              </Button>
            </Box>
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
