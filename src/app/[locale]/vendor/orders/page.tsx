"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

import LoadingSpinner from "@/components/common/LoadingSpinner";
import EmptyState from "@/components/common/EmptyState";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { vendorApi } from "@/lib/api/vendor";
import type { Order } from "@/lib/types";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = (typeof STATUSES)[number];

const STATUS_COLOR: Record<OrderStatus, "default" | "primary" | "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  refunded: "default",
};

export default function VendorOrdersPage() {
  const t = useTranslations("vendor");
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getOrders({ per_page: 100 });
      setOrders(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await vendorApi.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: status as Order["status"] } : o
        )
      );
      setSnack(t("statusUpdated"));
    } catch {
      setError(t("loadError"));
    }
  };

  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

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

  const statusLabel = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending: t("statusPending"),
      processing: t("statusProcessing"),
      shipped: t("statusShipped"),
      delivered: t("statusDelivered"),
      cancelled: t("statusCancelled"),
      refunded: t("statusRefunded"),
    };
    return map[s];
  };

  return (
    <Box>
      <VendorPageHeader
        title={t("myOrders")}
        subtitle={t("myOrdersSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>{t("orderStatus")}</InputLabel>
            <Select
              value={statusFilter}
              label={t("orderStatus")}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">—</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message={t("noOrders")} />
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("orderNumber")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("date")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("items")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("total")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("orderStatus")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      #{o.order_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(o.created_at)}</TableCell>
                  <TableCell>{o.items?.length ?? 0}</TableCell>
                  <TableCell>{currency(o.total)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={statusLabel(o.status)}
                        color={STATUS_COLOR[o.status]}
                      />
                      <Select
                        size="small"
                        value={o.status}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value)
                        }
                        sx={{ minWidth: 140 }}
                      >
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>
                            {statusLabel(s)}
                          </MenuItem>
                        ))}
                      </Select>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack}
      />
    </Box>
  );
}
