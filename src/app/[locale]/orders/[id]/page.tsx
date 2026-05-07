"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import type { Order } from "@/lib/types";
import { ordersApi } from "@/lib/api/orders";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi.getById(id).then((res) => setOrder(res.data.data)).catch(() => setError(t("common.error"))).finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <LoadingSpinner />;
  if (error || !order) return <ErrorMessage message={error || undefined} />;

  const shippingAddr = typeof order.shipping_address === "string"
    ? `${order.shipping_address}${order.shipping_city ? ", " + order.shipping_city : ""}`
    : `${order.shipping_address?.address ?? ""}${order.shipping_address?.city ? ", " + order.shipping_address.city : ""}`;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t("order.orderDetails")}</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">{t("order.orderNumber")}</p>
            <p className="font-semibold">#{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">{t("order.status")}</p>
            <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">{t(`order.statuses.${order.status}`)}</span>
          </div>
          <div>
            <p className="text-sm text-gray-400">{t("order.shippingAddress")}</p>
            <p>{shippingAddr}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">{t("order.date")}</p>
            <p>{new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">{t("order.items")}</h2>
        <hr className="border-gray-100 mb-4" />
        <div className="flex flex-col gap-4">
          {order.items?.map((item) => {
            const img = item.variant_image || item.product_image || item.product?.image || item.product?.images?.[0]?.image || "/placeholder-product.svg";
            return (
              <div key={item.id} className="flex items-center justify-between gap-4 flex-wrap">
                <div className="w-16 h-16 shrink-0 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={img} alt={item.product_name || item.product?.name || "Product"} className="max-w-[56px] max-h-[56px] object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {item.product_name || item.product?.name || `Product #${item.product_id}`} × {item.quantity}
                  </p>
                  {item.variant_label && <p className="text-xs text-gray-400">{item.variant_label}</p>}
                </div>
                <p className="font-semibold shrink-0">{item.total} {t("common.currency")}</p>
              </div>
            );
          })}
        </div>
        <hr className="border-gray-100 my-4" />
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">{t("cart.total")}</span>
          <span className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>{order.total} {t("common.currency")}</span>
        </div>
      </div>
    </div>
  );
}
