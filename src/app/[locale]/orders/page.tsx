"use client";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Card, CardContent, Box, Chip, Button } from "@mui/material";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import type { Order } from "@/lib/types";
import { ordersApi } from "@/lib/api/orders";

const statusColors: Record<string, "warning" | "info" | "primary" | "success" | "error" | "default"> = {
  pending: "warning", processing: "info", shipped: "primary", delivered: "success", cancelled: "error", refunded: "default",
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
  if (orders.length === 0) return <Container maxWidth="lg" sx={{ py: 4 }}><EmptyState message={t("order.noOrders")} /></Container>;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("order.title")}</Typography>
      {orders.map((order) => (
        <Card key={order.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{t("order.orderNumber")}: #{order.order_number}</Typography>
                <Typography variant="body2" color="text.secondary">{new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip label={t(`order.statuses.${order.status}`)} color={statusColors[order.status] || "default"} size="small" />
                <Typography color="primary" sx={{ fontWeight: 700 }}>{order.total} {t("common.currency")}</Typography>
                <Button component={Link} href={`/${locale}/orders/${order.id}`} size="small" variant="outlined">{t("order.orderDetails")}</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}
