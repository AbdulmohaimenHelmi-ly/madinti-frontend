"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Store, Star, ChevronLeft, ChevronRight } from "lucide-react";
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
  const isRtl = locale === "ar";
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
    Promise.all([vendorsApi.getById(id), vendorsApi.getProducts(id, { page, per_page: 12 })])
      .then(([vRes, pRes]) => {
        if (cancelled) return;
        setVendor(vRes.data.data); setProducts(pRes.data.data); setTotalPages(pRes.data.meta?.last_page ?? 1); setError(null); setLoadedKey(requestKey);
      }).catch(() => { if (cancelled) return; setError(t("common.error")); setLoadedKey(requestKey); });
    return () => { cancelled = true; };
  }, [id, page, requestKey, t]);

  if (loading) return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-4">
        <Store size={36} style={{ color: "var(--color-primary)" }} />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <hr className="border-gray-100 mb-8" />
      <h2 className="text-xl font-semibold mb-4">{t("vendor.products")}</h2>
      <ProductGridSkeleton count={8} />
    </div>
  );
  if (error || !vendor) return <ErrorMessage message={error || undefined} />;

  const name = locale === "en" && vendor.store_name_en ? vendor.store_name_en : vendor.store_name;
  const desc = locale === "en" && vendor.description_en ? vendor.description_en : vendor.description;
  const rating = Number(vendor.rating) || 0;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Store size={36} style={{ color: "var(--color-primary)" }} />
        <h1 className="text-3xl font-bold">{name}</h1>
      </div>
      {desc && <p className="text-gray-500 mb-3">{desc}</p>}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={16} style={{ color: s <= rating ? "#f59e0b" : "#d1d5db" }} fill={s <= rating ? "#f59e0b" : "none"} />)}</div>
        <span className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600">{t("vendor.totalSales")}: {vendor.total_sales}</span>
      </div>
      <hr className="border-gray-100 mb-8" />
      <h2 className="text-xl font-semibold mb-4">{t("vendor.products")}</h2>
      {products.length === 0 ? <EmptyState message={t("product.noProducts")} /> : (
        <>
          <ProductGrid products={products} />
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${p === page ? "text-white" : "border border-gray-200 hover:bg-gray-50"}`} style={p === page ? { background: "var(--color-primary)" } : {}}>{p}</button>;
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
