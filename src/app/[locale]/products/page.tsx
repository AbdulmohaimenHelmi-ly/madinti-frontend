"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ProductGrid from "@/components/products/ProductGrid";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Product, Category } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params: Record<string, string | number> = { page, per_page: 12 };
    if (categoryId) params.category_id = categoryId;
    if (sortBy) params.sort = sortBy;

    const fetchFn = search
      ? productsApi.search(search)
      : productsApi.getAll(params);

    fetchFn
      .then((res) => {
        setProducts(res.data.data);
        if (res.data.meta) setTotalPages(res.data.meta.last_page);
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [search, categoryId, sortBy, page, t]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
        {t("common.products")}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <TextField
          placeholder={t("product.searchProducts")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ minWidth: 250 }}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.disabled" }} />
              ),
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t("product.filterByCategory")}</InputLabel>
          <Select
            value={categoryId}
            label={t("product.filterByCategory")}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">{t("category.allCategories")}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={String(cat.id)}>
                {locale === "en" && cat.name_en ? cat.name_en : cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t("product.sortBy")}</InputLabel>
          <Select
            value={sortBy}
            label={t("product.sortBy")}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="newest">{t("product.newest")}</MenuItem>
            <MenuItem value="price_asc">{t("product.priceLowHigh")}</MenuItem>
            <MenuItem value="price_desc">{t("product.priceHighLow")}</MenuItem>
            <MenuItem value="top_rated">{t("product.topRated")}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : products.length === 0 ? (
        <EmptyState message={t("product.noProducts")} />
      ) : (
        <>
          <ProductGrid products={products} />
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
