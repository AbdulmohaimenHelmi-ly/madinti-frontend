"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { Order } from "@/lib/types";
import { ordersApi } from "@/lib/api/orders";

const statusClasses: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function OrdersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll().then((res) => setOrders(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (orders.length === 0) return <div className="max-w-screen-lg mx-auto px-4 py-8"><EmptyState message={t("order.noOrders")} /></div>;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("order.title")}</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <p className="font-semibold">{t("order.orderNumber")}: #{order.order_number}</p>
                <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClasses[order.status] || "bg-gray-100 text-gray-600"}`}>
                  {t(`order.statuses.${order.status}`)}
                </span>
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>{order.total} {t("common.currency")}</span>
                <Link href={`/${locale}/orders/${order.id}`} className="text-sm px-3 py-1 border border-gray-200 rounded-lg font-medium no-underline text-gray-700 hover:bg-gray-50 transition-colors">
                  {t("order.orderDetails")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
