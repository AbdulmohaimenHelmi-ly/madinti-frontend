"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Pencil, Plus, ImageOff, AlertCircle } from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import type { Product } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";
import DataPagination from "@/components/common/DataPagination";

const PER_PAGE = 15;

function stockClass(quantity: number) {
  if (quantity > 10) return "border-green-400 bg-green-50 text-green-700";
  if (quantity > 0) return "border-yellow-400 bg-yellow-50 text-yellow-700";
  return "border-red-400 bg-red-50 text-red-700";
}

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const tProduct = useTranslations("product");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const tContent = useTranslations("content");
  const audienceOptions = useAudienceOptions(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [audience, setAudience] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getProducts({ per_page: PER_PAGE, page });
      setProducts(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, page]);

  useEffect(() => {
    load();
  }, [load]);

  const productName = (p: Product) =>
    locale === "en" && p.name_en ? p.name_en : p.name;

  const vendorName = (p: Product) =>
    p.vendor
      ? locale === "en" && p.vendor.store_name_en
        ? p.vendor.store_name_en
        : p.vendor.store_name
      : "—";

  const categoryName = (p: Product) =>
    p.category
      ? locale === "en" && p.category.name_en
        ? p.category.name_en
        : p.category.name
      : "—";

  const primaryImage = (p: Product) =>
    p.images?.find((img) => img.is_primary)?.image ??
    p.images?.[0]?.image ??
    p.image ??
    null;

  const filteredProducts = products.filter((p) => {
    if (status === "1" && !p.is_active) return false;
    if (status === "0" && p.is_active) return false;
    if (audience && (p.content_type ?? "unisex") !== audience) return false;
    if (search) {
      const q = search.toLowerCase();
      const n = (productName(p) || "").toLowerCase();
      const v = (p.vendor?.store_name || "").toLowerCase();
      if (!n.includes(q) && !v.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <AdminPageHeader
        title={t("products")}
        subtitle={t("productsSubtitle")}
        action={{
          label: t("addProduct"),
          icon: <Plus size={16} />,
          href: `/${locale}/admin/products/new`,
        }}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchProducts")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "1", label: t("active") },
              { value: "0", label: t("inactive") },
            ],
          },
          {
            key: "audience",
            label: tContent("contentType"),
            value: audience,
            onChange: setAudience,
            options: audienceOptions,
          },
        ]}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={5} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState message={tProduct("noProducts")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tProduct("product")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tCommon("vendor")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tCommon("category")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tCommon("price")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tCommon("quantity")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {tContent("contentType")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t("status")}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                          {primaryImage(p) ? (
                            <img
                              src={primaryImage(p) ?? undefined}
                              alt={productName(p)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageOff size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{productName(p)}</p>
                          {p.sku && (
                            <p className="text-xs text-gray-500">{p.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{vendorName(p)}</td>
                    <td className="px-4 py-3">{categoryName(p)}</td>
                    <td className="px-4 py-3">
                      {p.price} {tCommon("currency")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stockClass(p.quantity)}`}
                      >
                        {p.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AudienceChip value={p.content_type} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.is_active ? t("active") : t("inactive")}
                        </span>
                        {p.is_featured && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700">
                            {tProduct("featured")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/admin/products/${p.id}/edit`}
                        title={tCommon("edit")}
                        className="inline-flex p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                      >
                        <Pencil size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
