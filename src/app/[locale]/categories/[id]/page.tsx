"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductGrid from "@/components/products/ProductGrid";
import { ProductGridSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import type { Product, Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api/categories";

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestKey = `${id}:${page}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    Promise.all([categoriesApi.getById(id), categoriesApi.getProducts(id, { page, per_page: 12 })])
      .then(([catRes, prodRes]) => {
        if (cancelled) return;
        setCategory(catRes.data.data);
        setProducts(prodRes.data.data);
        setTotalPages(prodRes.data.meta?.last_page ?? 1);
        setLoadedKey(requestKey);
      }).catch(() => {
        if (cancelled) return;
        setCategory(null); setProducts([]); setTotalPages(1); setLoadedKey(requestKey);
      });
    return () => { cancelled = true; };
  }, [id, page, requestKey]);

  const name = category ? (locale === "en" && category.name_en ? category.name_en : category.name) : "";

  if (loading) return <div className="max-w-[1200px] mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6">{t("category.productsIn")}</h1><ProductGridSkeleton count={12} /></div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("category.productsIn")} {name}</h1>
      {products.length === 0 ? <EmptyState message={t("product.noProducts")} /> : (
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
  );
}
