"use client";
import { useState, useEffect, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
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
    ordersApi
      .getById(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError(t("common.error")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <LoadingSpinner />;
  if (error || !order) return <ErrorMessage message={error || undefined} />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
        {t("order.orderDetails")}
      </Typography>
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
              <Typography>
                {typeof order.shipping_address === "string"
                  ? `${order.shipping_address}${order.shipping_city ? ", " + order.shipping_city : ""}`
                  : `${order.shipping_address?.address ?? ""}${order.shipping_address?.city ? ", " + order.shipping_address.city : ""}`}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary">{t("order.date")}</Typography>
              <Typography>
                {new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-LY" : "en-US")}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t("order.items")}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {order.items?.map((item) => {
            const img =
              item.variant_image ||
              item.product_image ||
              item.product?.image ||
              item.product?.images?.[0]?.image ||
              "/placeholder-product.svg";
            return (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: 1,
                    borderColor: "grey.200",
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src={img}
                    alt={item.product_name || item.product?.name || "Product image"}
                    sx={{ maxWidth: 56, maxHeight: 56, objectFit: "contain" }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {item.product_name || item.product?.name || `Product #${item.product_id}`} × {item.quantity}
                  </Typography>
                  {item.variant_label && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {item.variant_label}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontWeight: 600, flexShrink: 0 }}>
                  {item.total} {t("common.currency")}
                </Typography>
              </Box>
            );
          })}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("cart.total")}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {order.total} {t("common.currency")}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
