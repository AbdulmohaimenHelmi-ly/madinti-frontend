"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, ImageOff, Search, X } from "lucide-react";

import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";
import DataPagination from "@/components/common/DataPagination";
import EmptyState from "@/components/common/EmptyState";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi } from "@/lib/api/vendor";
import type { Product } from "@/lib/types";

const PER_PAGE = 15;

export default function VendorProductsPage() {
  const locale = useLocale();
  const t = useTranslations("vendor");
  const tCommon = useTranslations("common");
  const audienceOptions = useAudienceOptions(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<{ msg: string; sev: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [audience, setAudience] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!snack) return; const id = setTimeout(() => setSnack(null), 3500); return () => clearTimeout(id); }, [snack]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getProducts({ page, per_page: PER_PAGE });
      setProducts(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch { setError(t("loadError")); }
    finally { setLoading(false); }
  }, [page, t]);

  useEffect(() => { load(); }, [load]);

  const productName = (p: Product) => locale === "en" && p.name_en ? p.name_en : p.name;
  const categoryName = (p: Product) => { if (!p.category) return t("none"); return locale === "en" && p.category.name_en ? p.category.name_en : p.category.name; };
  const primaryImage = (p: Product) => p.images?.find((i) => i.is_primary)?.image ?? p.images?.[0]?.image ?? p.image ?? null;
  const currency = (v: number) => new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !productName(p).toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false;
    if (status === "active" && !p.is_active) return false;
    if (status === "inactive" && p.is_active) return false;
    if (audience && (p.content_type ?? "unisex") !== audience) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await vendorApi.deleteProduct(confirmDelete.id);
      setConfirmDelete(null);
      setSnack({ msg: t("productDeleted"), sev: "success" });
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch { setSnack({ msg: t("actionError"), sev: "error" }); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <VendorPageHeader title={t("myProducts")} subtitle={t("myProductsSubtitle")} action={{ label: t("addProduct"), icon: <Plus size={16} />, href: `/${locale}/vendor/products/new` }} />

      <div className="p-4 mb-4 bg-white rounded-2xl border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 start-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchProducts")} className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 ps-9 pe-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
            <option value="">{t("allStatuses")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
            {audienceOptions.map((o) => <option key={o.value || "all"} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}

      {loading ? <TableRowsSkeleton rows={8} columns={7} /> : filteredProducts.length === 0 ? <EmptyState message={t("noProducts")} /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tCommon("product")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("category")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tCommon("price")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tCommon("stock")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("audience")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tCommon("status")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
                          {primaryImage(product) ? <img src={primaryImage(product)!} alt={productName(product)} className="w-full h-full object-cover" /> : <ImageOff size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{productName(product)}</p>
                          {product.sku && <p className="text-xs text-gray-500">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{categoryName(product)}</td>
                    <td className="px-4 py-3 font-bold">{currency(product.price)} {tCommon("currency")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${product.quantity > 10 ? "bg-green-100 text-green-700 border-green-200" : product.quantity > 0 ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-red-100 text-red-700 border-red-200"}`}>{product.quantity}</span>
                    </td>
                    <td className="px-4 py-3"><AudienceChip value={product.content_type} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.is_active ? t("active") : t("inactive")}</span>
                        {product.is_featured && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">{t("featured")}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/${locale}/vendor/products/${product.id}/edit`} title={tCommon("edit")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"><Pencil size={16} /></Link>
                        <button type="button" title={tCommon("delete")} onClick={() => setConfirmDelete(product)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataPagination page={page} lastPage={lastPage} total={total} perPage={PER_PAGE} onChange={setPage} />
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">{tCommon("delete")}</h2>
              <button type="button" onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">{t("confirmDelete")}</p>
              {confirmDelete && <p className="mt-2 font-bold">{productName(confirmDelete)}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={deleting} className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">{tCommon("cancel")}</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">{tCommon("delete")}</button>
            </div>
          </div>
        </div>
      )}

      {snack && <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${snack.sev === "error" ? "bg-red-600" : "bg-gray-900"}`}>{snack.msg}</div>}
    </div>
  );
}
