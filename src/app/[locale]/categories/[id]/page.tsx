"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Pagination, Box } from "@mui/material";
import ProductGrid from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import type { Product, Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    setLoading(true);
    Promise.all([
      categoriesApi.getById(id),
      categoriesApi.getProducts(id, { page, per_page: 12 }),
    ]).then(([catRes, prodRes]) => {
      setCategory(catRes.data.data);
      setProducts(prodRes.data.data);
      if (prodRes.data.meta) setTotalPages(prodRes.data.meta.last_page);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, page]);
  if (loading)
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("category.productsIn")}</Typography>
        <ProductGridSkeleton count={12} />
      </Container>
    );
  const name = category ? (locale === "en" && category.name_en ? category.name_en : category.name) : "";
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("category.productsIn")} {name}</Typography>
      {products.length === 0 ? <EmptyState message={t("product.noProducts")} /> : (
        <>
          <ProductGrid products={products} />
          {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
        </>
      )}
    </Container>
  );
}
