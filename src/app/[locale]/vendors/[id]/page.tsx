"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Box, Rating, Chip, Divider, Pagination } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ProductGrid from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import ErrorMessage from "@/components/common/ErrorMessage";
import EmptyState from "@/components/common/EmptyState";
import type { Vendor, Product } from "@/lib/types";
import { vendorsApi } from "@/lib/api/vendors";

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestKey = `${id}:${page}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      vendorsApi.getById(id),
      vendorsApi.getProducts(id, { page, per_page: 12 }),
    ]).then(([vRes, pRes]) => {
      if (cancelled) return;

      setVendor(vRes.data.data);
      setProducts(pRes.data.data);
      setTotalPages(pRes.data.meta?.last_page ?? 1);
      setError(null);
      setLoadedKey(requestKey);
    }).catch(() => {
      if (cancelled) return;

      setError(t("common.error"));
      setLoadedKey(requestKey);
    });

    return () => {
      cancelled = true;
    };
  }, [id, page, requestKey, t]);

  if (loading)
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <StorefrontIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: "text.disabled" }}>…</Typography>
        </Box>
        <Divider sx={{ mb: 4 }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>{t("vendor.products")}</Typography>
        <ProductGridSkeleton count={8} />
      </Container>
    );
  if (error || !vendor) return <ErrorMessage message={error || undefined} />;
  const name = locale === "en" && vendor.store_name_en ? vendor.store_name_en : vendor.store_name;
  const desc = locale === "en" && vendor.description_en ? vendor.description_en : vendor.description;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <StorefrontIcon sx={{ fontSize: 40, color: "primary.main" }} />
        <Typography variant="h3" sx={{ fontWeight: 700 }}>{name}</Typography>
      </Box>
      {desc && <Typography color="text.secondary" sx={{ mb: 2 }}>{desc}</Typography>}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Rating value={Number(vendor.rating) || 0} readOnly precision={0.5} />
        <Chip label={`${t("vendor.totalSales")}: ${vendor.total_sales}`} variant="outlined" />
      </Box>
      <Divider sx={{ mb: 4 }} />
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>{t("vendor.products")}</Typography>
      {products.length === 0 ? <EmptyState message={t("product.noProducts")} /> : (
        <>
          <ProductGrid products={products} />
          {totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" /></Box>}
        </>
      )}
    </Container>
  );
}
