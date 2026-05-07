"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi } from "@/lib/api/vendor";
import type { Order } from "@/lib/types";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
type OrderStatus = (typeof STATUSES)[number];

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function VendorOrdersPage() {
  const t = useTranslations("vendor");
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { if (!snack) return; const id = setTimeout(() => setSnack(null), 3000); return () => clearTimeout(id); }, [snack]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getOrders({ per_page: 15, page });
      setOrders(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch { setError(t("loadError")); }
    finally { setLoading(false); }
  }, [t, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await vendorApi.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order["status"] } : o));
      setSnack(t("statusUpdated"));
    } catch { setError(t("loadError")); }
  };

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  const currency = (n: number) => new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", { maximumFractionDigits: 2 }).format(Number(n) || 0);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  const statusLabel = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = { pending: t("statusPending"), processing: t("statusProcessing"), shipped: t("statusShipped"), delivered: t("statusDelivered"), cancelled: t("statusCancelled"), refunded: t("statusRefunded") };
    return map[s];
  };

  return (
    <div>
      <VendorPageHeader title={t("myOrders")} subtitle={t("myOrdersSubtitle")} />

      {error && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4"><span>{error}</span></div>}

      <div className="p-4 mb-4 bg-white rounded-2xl border border-gray-100">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
          <option value="">—</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      {loading ? <TableRowsSkeleton rows={8} columns={5} /> : filtered.length === 0 ? <EmptyState message={t("noOrders")} /> : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("orderNumber")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("date")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("items")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("total")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("orderStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold">#{o.order_number}</td>
                    <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">{o.items?.length ?? 0}</td>
                    <td className="px-4 py-3">{currency(o.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[o.status as OrderStatus] ?? "bg-gray-100 text-gray-600"}`}>{statusLabel(o.status as OrderStatus)}</span>
                        <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataPagination page={page} lastPage={lastPage} total={total} perPage={15} onChange={setPage} />
        </>
      )}

      {snack && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">{snack}</div>}
    </div>
  );
}
