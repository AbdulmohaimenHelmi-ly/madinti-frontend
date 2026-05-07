"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { AlertCircle } from "lucide-react";

import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import { deliveryApi } from "@/lib/api/delivery";
import type { Order } from "@/lib/types";

type OrderWithVendor = Order & {
  vendor?: { id: number; store_name?: string | null } | null;
  user?: { id: number; name?: string | null; phone?: string | null } | null;
};

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = (typeof STATUSES)[number];

const STATUS_CHIP: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function DeliveryOrdersPage() {
  const t = useTranslations("delivery");
  const locale = useLocale();

  const [orders, setOrders] = useState<OrderWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Reset to page 1 whenever any filter changes.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, fromDate, toDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await deliveryApi.orders({
        page,
        per_page: 15,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        ...(fromDate ? { from_date: fromDate } : {}),
        ...(toDate ? { to_date: toDate } : {}),
      });
      setOrders(res.data.data as OrderWithVendor[]);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, fromDate, toDate, t]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const statusLabel = useMemo(
    () => ({
      pending: t("statusPending"),
      processing: t("statusProcessing"),
      shipped: t("statusShipped"),
      delivered: t("statusDelivered"),
      cancelled: t("statusCancelled"),
      refunded: t("statusRefunded"),
    }),
    [t]
  );

  return (
    <div>
      <DeliveryPageHeader title={t("orders")} subtitle={t("ordersSubtitle")} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchOrderNumberPlaceholder")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "", label: t("filterAll") },
              { value: "pending", label: statusLabel.pending },
              { value: "processing", label: statusLabel.processing },
              { value: "shipped", label: statusLabel.shipped },
              { value: "delivered", label: statusLabel.delivered },
              { value: "cancelled", label: statusLabel.cancelled },
              { value: "refunded", label: statusLabel.refunded },
            ],
          },
        ]}
        dateFrom={fromDate}
        dateTo={toDate}
        onDateFromChange={setFromDate}
        onDateToChange={setToDate}
        dateFromLabel={t("fromDate")}
        dateToLabel={t("toDate")}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={7} />
      ) : orders.length === 0 ? (
        <EmptyState message={t("noOrders")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("orderNumber")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("date")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("vendor")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("customer")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("city")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("total")}</th>
                  <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("status")}</th>
                  <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const addr =
                    typeof o.shipping_address === "object" && o.shipping_address
                      ? o.shipping_address
                      : null;
                  const customerName = o.user?.name ?? addr?.name ?? "—";
                  const cityName = o.shipping_city ?? addr?.city ?? "—";
                  return (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold">#{o.order_number}</td>
                      <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3">{o.vendor?.store_name ?? "—"}</td>
                      <td className="px-4 py-3">{customerName}</td>
                      <td className="px-4 py-3">{cityName}</td>
                      <td className="px-4 py-3">{currency(o.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[o.status as OrderStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {statusLabel[o.status as OrderStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Link
                          href={`/${locale}/delivery/orders/${o.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          {t("viewOrder")}
                        </Link>
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
          <span className="mt-1 block text-end text-xs text-gray-500">
            {total} {t("orders")}
          </span>
        </>
      )}
    </div>
  );
}
