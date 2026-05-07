"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Truck, CheckCircle, XCircle, Package, AlertCircle } from "lucide-react";

import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";
import { deliveryApi } from "@/lib/api/delivery";
import type { Order } from "@/lib/types";

type OrderDetail = Order & {
  vendor?: { id: number; store_name?: string | null; phone?: string | null } | null;
  user?: { id: number; name?: string | null; phone?: string | null; email?: string | null } | null;
};

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

export default function DeliveryOrderDetailPage() {
  const t = useTranslations("delivery");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await deliveryApi.order(id);
      setOrder(res.data.data as OrderDetail);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(() => setSnack(null), 3000);
    return () => clearTimeout(timer);
  }, [snack]);

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

  const currency = (n: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-LY" : "en-US", {
      maximumFractionDigits: 2,
    }).format(Number(n) || 0);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ar" ? "ar-LY" : "en-US");

  const setStatus = async (status: string) => {
    if (!order) return;
    if (status === "cancelled" && !window.confirm(t("confirmCancelOrder"))) return;
    setUpdating(true);
    try {
      const res = await deliveryApi.updateOrderStatus(order.id, status);
      setOrder(res.data.data as OrderDetail);
      setSnack(t("statusUpdated"));
    } catch {
      setError(t("statusUpdateError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <DeliveryPageHeader title={t("orders")} />
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error || t("loadError")}</span>
        </div>
      </div>
    );
  }

  const addr =
    typeof order.shipping_address === "object" && order.shipping_address
      ? order.shipping_address
      : null;

  const nextActions: Array<{
    label: string;
    btnClass: string;
    icon: React.ReactNode;
    target: "processing" | "shipped" | "delivered" | "cancelled";
  }> = [];

  if (order.status === "pending") {
    nextActions.push({
      label: t("markProcessing"),
      btnClass: "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 bg-blue-600",
      icon: <Package size={16} />,
      target: "processing",
    });
  }
  if (order.status === "processing") {
    nextActions.push({
      label: t("markShipped"),
      btnClass: "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50",
      icon: <Truck size={16} />,
      target: "shipped",
    });
  }
  if (order.status === "shipped") {
    nextActions.push({
      label: t("markDelivered"),
      btnClass: "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 bg-green-600",
      icon: <CheckCircle size={16} />,
      target: "delivered",
    });
  }
  if (["pending", "processing"].includes(order.status)) {
    nextActions.push({
      label: t("cancelOrder"),
      btnClass: "inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50",
      icon: <XCircle size={16} />,
      target: "cancelled",
    });
  }

  return (
    <div>
      <DeliveryPageHeader
        title={`#${order.order_number}`}
        breadcrumb={t("orders")}
        subtitle={formatDate(order.created_at)}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="mb-4">
        <Link
          href={`/${locale}/delivery/orders`}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
        >
          <BackIcon size={16} />
          {t("backToOrders")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">{t("status")}</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                {statusLabel[order.status]}
              </span>
            </div>
            {nextActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextActions.map((a) => (
                  <button
                    key={a.target}
                    type="button"
                    onClick={() => setStatus(a.target)}
                    disabled={updating}
                    className={a.btnClass}
                    style={a.target === "shipped" ? { background: "var(--color-primary)" } : undefined}
                  >
                    {a.icon}
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-4">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-extrabold">{t("items")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t("items")}</th>
                    <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("price")}</th>
                    <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">×</th>
                    <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm">
                          {it.product_name ?? it.product?.name ?? `#${it.product_id}`}
                        </p>
                        {it.variant_label && (
                          <span className="text-xs text-gray-400">{it.variant_label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-end">{currency(it.price)}</td>
                      <td className="px-4 py-3 text-end">{it.quantity}</td>
                      <td className="px-4 py-3 text-end">{currency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <hr className="border-gray-100" />
            <div className="p-6">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t("price")}</span>
                  <span className="text-sm">{currency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{t("orders")} ({t("price")})</span>
                  <span className="text-sm">{currency(order.shipping_cost)}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-base font-extrabold">{t("total")}</span>
                  <span className="text-base font-extrabold">{currency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("vendor")}</p>
            <p className="text-base font-bold">{order.vendor?.store_name ?? "—"}</p>
            {order.vendor?.phone && (
              <p className="text-sm text-gray-500">{order.vendor.phone}</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("customer")}</p>
            <p className="text-base font-bold">{order.user?.name ?? addr?.name ?? "—"}</p>
            {(order.shipping_phone || addr?.phone || order.user?.phone) && (
              <p className="text-sm text-gray-500">
                {order.shipping_phone ?? addr?.phone ?? order.user?.phone}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{t("shippingAddress")}</p>
            {addr ? (
              <div>
                {addr.address && <p className="text-sm">{addr.address}</p>}
                {(addr.city || order.shipping_city) && (
                  <p className="text-sm text-gray-500">{addr.city ?? order.shipping_city}</p>
                )}
              </div>
            ) : typeof order.shipping_address === "string" ? (
              <p className="text-sm">{order.shipping_address}</p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>

      {snack && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {snack}
        </div>
      )}
    </div>
  );
}
