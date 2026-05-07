"use client";
import { startTransition, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import ProductGrid from "@/components/products/ProductGrid";
import ProductsFilterSidebar, { FilterState, emptyFilterState } from "@/components/products/ProductsFilterSidebar";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Product, Category, Brand, ProductOption, ApiResponse } from "@/lib/types";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { brandsApi } from "@/lib/api/brands";
import apiClient from "@/lib/api/client";
import { useContentFilter } from "@/lib/context/ContentFilterContext";

export default function ProductsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const searchParams = useSearchParams();
  const { apiParam: contentType, setFilter } = useContentFilter();
  const requestedCategoryId = searchParams.get("category_id") ?? "";
  const requestedBrand = searchParams.get("brand") || searchParams.get("brand_id");
  const requestedBrandIds = requestedBrand ? [Number(requestedBrand)].filter((n) => !Number.isNaN(n)) : [];
  const requestedSearch = searchParams.get("q") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(requestedSearch);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<FilterState>(() => ({ ...emptyFilterState(), categoryId: requestedCategoryId, brandIds: requestedBrandIds }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const requestedContentType = searchParams.get("content_type");
  const effectiveContentType = requestedContentType === "male" || requestedContentType === "female" ? requestedContentType : contentType;

  useEffect(() => { if (requestedContentType === "male" || requestedContentType === "female") setFilter(requestedContentType); }, [requestedContentType, setFilter]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map((p) => Number(p.price));
    return { min: Math.floor(Math.min(...prices, 0)), max: Math.ceil(Math.max(...prices, 1)) };
  }, [products]);

  useEffect(() => {
    const params = effectiveContentType ? { content_type: effectiveContentType } : undefined;
    categoriesApi.getAll(params).then((res) => setCategories(res.data.data)).catch(() => {});
    brandsApi.getAll(params).then((res) => setBrands(res.data.data)).catch(() => {});
    apiClient.get<ApiResponse<ProductOption[]>>("/options").then((res) => setOptions(res.data.data)).catch(() => {});
  }, [effectiveContentType]);

  useEffect(() => {
    startTransition(() => { setLoading(true); setError(null); });
    const params: Record<string, string | number> = { page, per_page: 12 };
    if (search.trim()) params.q = search.trim();
    if (filters.categoryId) params.category_id = filters.categoryId;
    if (sortBy) params.sort = sortBy;
    if (effectiveContentType) params.content_type = effectiveContentType;
    if (filters.priceMin !== "") params.min_price = filters.priceMin;
    if (filters.priceMax !== "") params.max_price = filters.priceMax;
    if (filters.inStock) params.in_stock = 1;
    const arrayParams: Record<string, number[]> = {};
    if (filters.brandIds.length) arrayParams.brand_ids = filters.brandIds;
    if (filters.optionValueIds.length) arrayParams.option_value_ids = filters.optionValueIds;
    productsApi.getAll({ ...params, ...flattenArrays(arrayParams) })
      .then((res) => { setProducts(res.data.data); if (res.data.meta) { setTotalPages(res.data.meta.last_page); setTotalItems(res.data.meta.total); } })
      .catch(() => setError(t("common.error"))).finally(() => setLoading(false));
  }, [search, sortBy, page, filters, effectiveContentType, t]);

  useEffect(() => { startTransition(() => setPage(1)); }, [filters, search, sortBy, effectiveContentType]);

  const labelOf = useCallback((item: { name?: string; name_en?: string | null; value?: string; value_en?: string | null }): string => {
    if (locale === "en") return (item.name_en || item.value_en || item.name || item.value || "") as string;
    return (item.name || item.value || item.name_en || item.value_en || "") as string;
  }, [locale]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    if (filters.categoryId) { const cat = categories.find((c) => String(c.id) === filters.categoryId); if (cat) chips.push({ key: `cat-${cat.id}`, label: labelOf(cat), onClear: () => setFilters((f) => ({ ...f, categoryId: "" })) }); }
    for (const bid of filters.brandIds) { const b = brands.find((x) => x.id === bid); if (b) chips.push({ key: `brand-${bid}`, label: labelOf(b), onClear: () => setFilters((f) => ({ ...f, brandIds: f.brandIds.filter((x) => x !== bid) })) }); }
    for (const vid of filters.optionValueIds) { for (const opt of options) { const v = opt.values.find((x) => x.id === vid); if (v) { chips.push({ key: `val-${vid}`, label: labelOf(v), onClear: () => setFilters((f) => ({ ...f, optionValueIds: f.optionValueIds.filter((x) => x !== vid) })) }); break; } } }
    if (filters.priceMin !== "" || filters.priceMax !== "") chips.push({ key: "price", label: `${filters.priceMin || priceBounds.min} - ${filters.priceMax || priceBounds.max}`, onClear: () => setFilters((f) => ({ ...f, priceMin: "", priceMax: "" })) });
    if (filters.inStock) chips.push({ key: "stock", label: t("product.inStockOnly") || "In stock", onClear: () => setFilters((f) => ({ ...f, inStock: false })) });
    return chips;
  }, [filters, categories, brands, options, labelOf, priceBounds, t]);

  const sidebar = <ProductsFilterSidebar categories={categories} brands={brands} options={options} value={filters} onChange={setFilters} priceBounds={priceBounds} />;

  const sortOptions = [
    { value: "newest", label: t("product.newest") },
    { value: "price_asc", label: t("product.priceLowHigh") },
    { value: "price_desc", label: t("product.priceHighLow") },
    { value: "top_rated", label: t("product.topRated") },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-2">{t("common.products")}</h1>
        <div className="w-12 h-1 rounded-full" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))" }} />
      </div>

      <div className="flex items-start gap-6">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[280px] shrink-0 sticky top-22 max-h-[calc(100vh-100px)] overflow-y-auto">{sidebar}</div>

        {/* Right column */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap mb-4 p-3 bg-white rounded-2xl border border-gray-200">
            <button className="md:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold" onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal size={15} />{t("product.filter") || "Filter"}
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 bg-white">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input placeholder={t("product.searchProducts")} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent focus:outline-none" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white min-w-[180px]">
              {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="text-sm text-gray-400 ms-auto">{totalItems > 0 ? t("product.totalItems", { count: totalItems }) || `${totalItems} items` : ""}</span>
          </div>

          {/* Active chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100">
                  {c.label}<button onClick={c.onClear} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                </span>
              ))}
              <button onClick={() => setFilters(emptyFilterState())} className="text-sm font-bold px-2 py-1 rounded" style={{ color: "var(--color-primary)" }}>
                {t("product.clearAll") || "Clear all"}
              </button>
            </div>
          )}

          {loading ? <ProductGridSkeleton count={12} /> :
            error ? <ErrorMessage message={error} /> :
            products.length === 0 ? <EmptyState message={t("product.noProducts")} /> : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                      return (
                        <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? "text-white" : "border border-gray-200 hover:bg-gray-50"}`} style={p === page ? { background: "var(--color-primary)" } : {}}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                      {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className={`relative bg-white w-80 h-full overflow-y-auto p-4 shadow-xl ${isRtl ? "ms-auto" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold">{t("product.filter") || "Filter"}</span>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}

function flattenArrays(map: Record<string, number[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, arr] of Object.entries(map)) arr.forEach((v, i) => { out[`${key}[${i}]`] = String(v); });
  return out;
}
