"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Pagination,
  Drawer,
  Button,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import ProductGrid from "@/components/products/ProductGrid";
import ProductsFilterSidebar, {
  FilterState,
  emptyFilterState,
} from "@/components/products/ProductsFilterSidebar";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Product, Category, Brand, ProductOption, ApiResponse } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { brandsApi } from "@/lib/api/brands";
import apiClient from "@/lib/api/client";

// Sidebar width — keep aligned with the SHEIN-like fixed column.
const SIDEBAR_WIDTH = 280;

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<FilterState>(emptyFilterState());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Seed initial filter state from the URL query string so deep links like
  // `/products?category_id=18` open the page with the matching filter active.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const catId = sp.get("category_id");
    const brand = sp.get("brand") || sp.get("brand_id");
    const q = sp.get("q");
    setFilters((f) => ({
      ...f,
      categoryId: catId ?? f.categoryId,
      brandIds: brand ? [Number(brand)].filter((n) => !Number.isNaN(n)) : f.brandIds,
    }));
    if (q) setSearch(q);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute price bounds from the current product set so the slider has a
  // realistic range. Falls back to 0..1000 until products arrive.
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map((p) => Number(p.price));
    const min = Math.floor(Math.min(...prices, 0));
    const max = Math.ceil(Math.max(...prices, 1));
    return { min, max: max > min ? max : min + 100 };
  }, [products]);

  // ---------- Initial reference data ----------
  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
    brandsApi
      .getAll()
      .then((res) => setBrands(res.data.data))
      .catch(() => {});
    apiClient
      .get<ApiResponse<ProductOption[]>>("/options")
      .then((res) => setOptions(res.data.data))
      .catch(() => {});
  }, []);

  // ---------- Reload products whenever filters change ----------
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Build query params for the unified /products endpoint.
    const params: Record<string, string | number> = { page, per_page: 12 };
    if (search.trim()) params.q = search.trim();
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (sortBy) params.sort = sortBy;
    if (filters.priceMin !== "") params.min_price = filters.priceMin;
    if (filters.priceMax !== "") params.max_price = filters.priceMax;
    if (filters.inStock) params.in_stock = 1;

    // Bracket-indexed array params -> Laravel parses them as arrays.
    const arrayParams: Record<string, number[]> = {};
    if (filters.brandIds.length) arrayParams.brand_ids = filters.brandIds;
    if (filters.optionValueIds.length)
      arrayParams.option_value_ids = filters.optionValueIds;

    productsApi
      .getAll({ ...params, ...flattenArrays(arrayParams) })
      .then((res) => {
        setProducts(res.data.data);
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page);
          setTotalItems(res.data.meta.total);
        }
      })
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [search, sortBy, page, filters, t]);

  // Reset page back to 1 whenever filters or search change.
  useEffect(() => {
    setPage(1);
  }, [filters, search, sortBy]);

  // ---------- Active filter chips for the toolbar ----------
  const labelOf = useCallback(
    (item: {
      name?: string;
      name_en?: string | null;
      value?: string;
      value_en?: string | null;
    }): string => {
      if (locale === "en")
        return (item.name_en || item.value_en || item.name || item.value || "") as string;
      return (item.name || item.value || item.name_en || item.value_en || "") as string;
    },
    [locale]
  );

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (filters.categoryId) {
      const cat = categories.find((c) => String(c.id) === filters.categoryId);
      if (cat)
        chips.push({
          key: `cat-${cat.id}`,
          label: labelOf(cat),
          onClear: () => setFilters((f) => ({ ...f, categoryId: "" })),
        });
    }
    for (const bid of filters.brandIds) {
      const b = brands.find((x) => x.id === bid);
      if (b)
        chips.push({
          key: `brand-${bid}`,
          label: labelOf(b),
          onClear: () =>
            setFilters((f) => ({ ...f, brandIds: f.brandIds.filter((x) => x !== bid) })),
        });
    }
    for (const vid of filters.optionValueIds) {
      for (const opt of options) {
        const v = opt.values.find((x) => x.id === vid);
        if (v) {
          chips.push({
            key: `val-${vid}`,
            label: labelOf(v),
            onClear: () =>
              setFilters((f) => ({
                ...f,
                optionValueIds: f.optionValueIds.filter((x) => x !== vid),
              })),
          });
          break;
        }
      }
    }
    if (filters.priceMin !== "" || filters.priceMax !== "") {
      chips.push({
        key: "price",
        label: `${filters.priceMin || priceBounds.min} - ${filters.priceMax || priceBounds.max}`,
        onClear: () => setFilters((f) => ({ ...f, priceMin: "", priceMax: "" })),
      });
    }
    if (filters.inStock) {
      chips.push({
        key: "stock",
        label: t("product.inStockOnly") || "In stock",
        onClear: () => setFilters((f) => ({ ...f, inStock: false })),
      });
    }
    return chips;
  }, [filters, categories, brands, options, labelOf, priceBounds, t]);

  // Sidebar element shared between desktop column and mobile drawer.
  const sidebar = (
    <ProductsFilterSidebar
      categories={categories}
      brands={brands}
      options={options}
      value={filters}
      onChange={setFilters}
      priceBounds={priceBounds}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Page heading */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t("common.products")}
        </Typography>
        <Box
          sx={(theme) => ({
            width: 48,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          })}
        />
      </Box>

      {/* 2-column layout */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
        {/* Sticky filter sidebar (desktop) */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            position: "sticky",
            top: 88,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          {sidebar}
        </Box>

        {/* Right column — toolbar + grid */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Toolbar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "white",
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            {/* Mobile filter toggle */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setMobileFiltersOpen(true)}
              sx={{ display: { md: "none" }, fontWeight: 700 }}
            >
              {t("product.filter") || "Filter"}
            </Button>

            <TextField
              placeholder={t("product.searchProducts")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 220, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon sx={{ mr: 1, color: "text.disabled" }} />
                  ),
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                renderValue={(val) => (
                  <Stack direction="row" sx={{ alignItems: "center" }}>
                    <Typography
                      component="span"
                      sx={{ color: "text.secondary", fontSize: 13, mr: 1 }}
                    >
                      {t("product.sortBy")}:
                    </Typography>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: 14 }}>
                      {sortLabel(val as string, t)}
                    </Typography>
                  </Stack>
                )}
              >
                <MenuItem value="newest">{t("product.newest")}</MenuItem>
                <MenuItem value="price_asc">{t("product.priceLowHigh")}</MenuItem>
                <MenuItem value="price_desc">{t("product.priceHighLow")}</MenuItem>
                <MenuItem value="top_rated">{t("product.topRated")}</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexBasis: "100%", display: { sm: "none" } }} />
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", ml: { sm: "auto" } }}
            >
              {totalItems > 0
                ? t("product.totalItems", { count: totalItems }) ||
                  `${totalItems} items`
                : ""}
            </Typography>
          </Box>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", rowGap: 1, mb: 2 }}
            >
              {activeChips.map((c) => (
                <Chip
                  key={c.key}
                  label={c.label}
                  onDelete={c.onClear}
                  size="small"
                  sx={{ bgcolor: "grey.100", fontWeight: 600 }}
                />
              ))}
              <Button
                size="small"
                onClick={() => setFilters(emptyFilterState())}
                sx={{ fontWeight: 700, textTransform: "none" }}
              >
                {t("product.clearAll") || "Clear all"}
              </Button>
            </Stack>
          )}

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : products.length === 0 ? (
            <EmptyState message={t("product.noProducts")} />
          ) : (
            <>
              <ProductGrid products={products} />
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, val) => setPage(val)}
                    color="primary"
                    size="large"
                    sx={{
                      "& .MuiPaginationItem-root": { fontWeight: 600 },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Mobile filters drawer */}
      <Drawer
        anchor={locale === "ar" ? "right" : "left"}
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        slotProps={{ paper: { sx: { width: 320, p: 1.5 } } }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 0.5, pb: 1 }}
        >
          <Typography sx={{ fontWeight: 800 }}>
            {t("product.filter") || "Filter"}
          </Typography>
          <IconButton onClick={() => setMobileFiltersOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        {sidebar}
      </Drawer>
    </Container>
  );
}

// ---------- helpers ----------

/**
 * Spread a number-array param map into bracket-indexed string entries that
 * Axios serializes as `key[0]=v0&key[1]=v1`, which Laravel parses as a real
 * array on the server side.
 */
function flattenArrays(map: Record<string, number[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, arr] of Object.entries(map)) {
    arr.forEach((v, i) => {
      out[`${key}[${i}]`] = String(v);
    });
  }
  return out;
}

function sortLabel(val: string, t: (k: string) => string): string {
  switch (val) {
    case "price_asc":
      return t("product.priceLowHigh");
    case "price_desc":
      return t("product.priceHighLow");
    case "top_rated":
      return t("product.topRated");
    case "newest":
    default:
      return t("product.newest");
  }
}