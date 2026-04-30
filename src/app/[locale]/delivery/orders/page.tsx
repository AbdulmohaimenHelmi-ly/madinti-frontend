"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

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

const STATUS_COLOR: Record<
  OrderStatus,
  "default" | "primary" | "warning" | "info" | "success" | "error"
> = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  refunded: "default",
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
    <Box>
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={7} />
      ) : orders.length === 0 ? (
        <EmptyState message={t("noOrders")} />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t("orderNumber")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("date")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("vendor")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("customer")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("city")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("total")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    {t("actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => {
                  const addr =
                    typeof o.shipping_address === "object" && o.shipping_address
                      ? o.shipping_address
                      : null;
                  const customerName = o.user?.name ?? addr?.name ?? "—";
                  const cityName = o.shipping_city ?? addr?.city ?? "—";
                  return (
                    <TableRow key={o.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{o.order_number}</TableCell>
                      <TableCell>{formatDate(o.created_at)}</TableCell>
                      <TableCell>{o.vendor?.store_name ?? "—"}</TableCell>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>{cityName}</TableCell>
                      <TableCell>{currency(o.total)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusLabel[o.status]}
                          color={STATUS_COLOR[o.status]}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={Link}
                          href={`/${locale}/delivery/orders/${o.id}`}
                          size="small"
                          variant="outlined"
                        >
                          {t("viewOrder")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <DataPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={15}
            onChange={setPage}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block", textAlign: "end" }}
          >
            {total} {t("orders")}
          </Typography>
        </>
      )}
    </Box>
  );
}
