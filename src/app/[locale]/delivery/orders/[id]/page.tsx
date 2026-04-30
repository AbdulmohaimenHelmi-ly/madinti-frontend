"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";
import { deliveryApi } from "@/lib/api/delivery";
import type { Order } from "@/lib/types";

type OrderDetail = Order & {
  vendor?: { id: number; store_name?: string | null; phone?: string | null } | null;
  user?: { id: number; name?: string | null; phone?: string | null; email?: string | null } | null;
};

const STATUS_COLOR = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  refunded: "default",
} as const;

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

  const Back = locale === "ar" ? ArrowForwardIcon : ArrowBackIcon;

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
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <DeliveryPageHeader title={t("orders")} />
        <Alert severity="error">{error || t("loadError")}</Alert>
      </Box>
    );
  }

  const addr =
    typeof order.shipping_address === "object" && order.shipping_address
      ? order.shipping_address
      : null;

  const nextActions: Array<{
    label: string;
    color: "primary" | "success" | "info" | "error";
    icon: React.ReactNode;
    target: "processing" | "shipped" | "delivered" | "cancelled";
  }> = [];

  if (order.status === "pending") {
    nextActions.push({
      label: t("markProcessing"),
      color: "info",
      icon: <Inventory2Icon />,
      target: "processing",
    });
  }
  if (order.status === "processing") {
    nextActions.push({
      label: t("markShipped"),
      color: "primary",
      icon: <LocalShippingIcon />,
      target: "shipped",
    });
  }
  if (order.status === "shipped") {
    nextActions.push({
      label: t("markDelivered"),
      color: "success",
      icon: <CheckCircleIcon />,
      target: "delivered",
    });
  }
  if (["pending", "processing"].includes(order.status)) {
    nextActions.push({
      label: t("cancelOrder"),
      color: "error",
      icon: <CancelIcon />,
      target: "cancelled",
    });
  }

  return (
    <Box>
      <DeliveryPageHeader
        title={`#${order.order_number}`}
        breadcrumb={t("orders")}
        subtitle={formatDate(order.created_at)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Stack direction="row" sx={{ mb: 2 }}>
        <Button
          component={Link}
          href={`/${locale}/delivery/orders`}
          startIcon={<Back />}
          size="small"
        >
          {t("backToOrders")}
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("status")}
              </Typography>
              <Chip
                label={statusLabel[order.status]}
                color={STATUS_COLOR[order.status]}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            {nextActions.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {nextActions.map((a) => (
                  <Button
                    key={a.target}
                    onClick={() => setStatus(a.target)}
                    disabled={updating}
                    variant={a.color === "error" ? "outlined" : "contained"}
                    color={a.color}
                    startIcon={a.icon}
                  >
                    {a.label}
                  </Button>
                ))}
              </Stack>
            )}
          </Paper>

          <Paper
            sx={{
              p: 0,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t("items")}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("items")}</TableCell>
                    <TableCell align="right">{t("price")}</TableCell>
                    <TableCell align="right">×</TableCell>
                    <TableCell align="right">{t("total")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {it.product_name ?? it.product?.name ?? `#${it.product_id}`}
                        </Typography>
                        {it.variant_label && (
                          <Typography variant="caption" color="text.secondary">
                            {it.variant_label}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{currency(it.price)}</TableCell>
                      <TableCell align="right">{it.quantity}</TableCell>
                      <TableCell align="right">{currency(it.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Stack spacing={1} sx={{ maxWidth: 320, ml: "auto" }}>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("price")}
                  </Typography>
                  <Typography variant="body2">{currency(order.subtotal)}</Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("orders")} ({t("price")})
                  </Typography>
                  <Typography variant="body2">{currency(order.shipping_cost)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t("total")}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {currency(order.total)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t("vendor")}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {order.vendor?.store_name ?? "—"}
              </Typography>
              {order.vendor?.phone && (
                <Typography variant="body2" color="text.secondary">
                  {order.vendor.phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t("customer")}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {order.user?.name ?? addr?.name ?? "—"}
              </Typography>
              {(order.shipping_phone || addr?.phone || order.user?.phone) && (
                <Typography variant="body2" color="text.secondary">
                  {order.shipping_phone ?? addr?.phone ?? order.user?.phone}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t("shippingAddress")}
              </Typography>
              {addr ? (
                <Box>
                  {addr.address && (
                    <Typography variant="body2">{addr.address}</Typography>
                  )}
                  {(addr.city || order.shipping_city) && (
                    <Typography variant="body2" color="text.secondary">
                      {addr.city ?? order.shipping_city}
                    </Typography>
                  )}
                </Box>
              ) : typeof order.shipping_address === "string" ? (
                <Typography variant="body2">{order.shipping_address}</Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
      />
    </Box>
  );
}
