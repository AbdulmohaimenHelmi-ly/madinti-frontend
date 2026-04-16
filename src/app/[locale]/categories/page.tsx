"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Grid } from "@mui/material";
import CategoryCard from "@/components/categories/CategoryCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

export default function CategoriesPage() {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    categoriesApi.getAll().then((res) => setCategories(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  if (categories.length === 0) return <EmptyState message={t("category.noCategories")} />;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("category.allCategories")}</Typography>
      <Grid container spacing={3}>
        {categories.map((cat) => (<Grid key={cat.id} size={{ xs: 6, sm: 4, md: 3 }}><CategoryCard category={cat} /></Grid>))}
      </Grid>
    </Container>
  );
}
