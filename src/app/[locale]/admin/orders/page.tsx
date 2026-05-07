"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Pencil, Eye, AlertCircle } from "lucide-react";

import { adminApi } from "@/lib/api/admin";
import type { Order } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type Status = (typeof STATUSES)[number];

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | Status>("");
  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Status>("pending");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 15, page };
      if (status) params.status = status;
      const res = await adminApi.getOrders(params);
      setOrders(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [status, t, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => setSnack(""), 3000);
    return () => clearTimeout(timer);
  }, [snack]);

  const openOrder = async (id: number) => {
    try {
      const res = await adminApi.getOrder(id);
      setViewOrder(res.data.data);
      setNewStatus(res.data.data.status as Status);
    } catch {
      setError(t("loadError"));
    }
  };

  const saveStatus = async () => {
    if (!viewOrder) return;
    try {
      await adminApi.updateOrderStatus(viewOrder.id, newStatus);
      setSnack(t("updated"));
      setViewOrder(null);
      load();
    } catch {
      setError(t("actionError"));
    }
  };

  const shippingAddressLabel = (order: Order) => {
    if (typeof order.shipping_address === "string") {
      return `${order.shipping_address}${order.shipping_city ? ", " + order.shipping_city : ""}`;
    }

    const address = order.shipping_address?.address ?? "";
    const city = order.shipping_address?.city ?? "";
    return `${address}${city ? ", " + city : ""}`;
  };

  return (
    <div>
      <AdminPageHeader title={t("orders")} subtitle={t("ordersSubtitle")} />

      <AdminToolbar
        selects={[
          {
            key: "status",
            label: tOrder("status"),
            value: status,
            options: [
              { value: "", label: t("allStatuses") },
              ...STATUSES.map((s) => ({ value: s, label: tOrder(`statuses.${s}`) })),
            ],
            onChange: (v) => setStatus(v as "" | Status),
          },
        ]}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={6} />
      ) : orders.length === 0 ? (
        <EmptyState message={tOrder("noOrders")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tOrder("orderNumber")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("name")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("storeName")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tOrder("status")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tCommon("total")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{tOrder("date")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const rich = o as Order & {
                    user?: { id: number; name: string; email: string };
                    vendor?: { id: number; store_name: string } | null;
                  };
                  return (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold">#{o.order_number}</td>
                      <td className="px-4 py-3">{rich.user?.name ?? "—"}</td>
                      <td className="px-4 py-3">{rich.vendor?.store_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {tOrder(`statuses.${o.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {Number(o.total).toFixed(2)} {tCommon("currency")}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(o.created_at).toLocaleDateString(
                          locale === "ar" ? "ar-LY" : "en-US"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/${locale}/orders/${o.id}`}
                            target="_blank"
                            title={tCommon("view")}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition inline-flex"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            type="button"
                            title={tCommon("edit")}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            onClick={() => openOrder(o.id)}
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DataPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={15}
            onChange={setPage}
          />
        </>
      )}

      {/* Order detail / status update dialog */}
      {!!viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewOrder(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">#{viewOrder.order_number}</h2>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between text-sm">
                <span>{tCommon("total")}</span>
                <strong>{Number(viewOrder.total).toFixed(2)} {tCommon("currency")}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>{tOrder("shippingAddress")}</span>
                <span>{shippingAddressLabel(viewOrder)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{tOrder("phone")}</span>
                <span>{viewOrder.shipping_phone}</span>
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{tOrder("status")}</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Status)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{tOrder(`statuses.${s}`)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewOrder(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={saveStatus}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {snack && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {snack}
        </div>
      )}
    </div>
  );
}
