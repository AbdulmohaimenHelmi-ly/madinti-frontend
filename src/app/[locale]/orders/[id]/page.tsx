"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Typography, Card, CardContent, Box, Chip, Divider, Grid } from "@mui/material";
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
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>{t("order.orderDetails")}</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary">{t("order.orderNumber")}</Typography>
              <Typography sx={{ fontWeight: 600 }}>#{order.order_number}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary">{t("order.status")}</Typography>
              <Chip label={t(`order.statuses.${order.status}`)} color="primary" size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary">{t("order.shippingAddress")}</Typography>
              <Typography>{order.shipping_address}, {order.shipping_city}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary">{t("order.date")}</Typography>
              <Typography>{new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t("order.items")}</Typography>
          <Divider sx={{ mb: 2 }} />
          {order.items?.map((item) => (
            <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography>{item.product?.name || `Product #${item.product_id}`} × {item.quantity}</Typography>
              <Typography sx={{ fontWeight: 600 }}>{item.total} {t("common.currency")}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t("cart.total")}</Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>{order.total} {t("common.currency")}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
