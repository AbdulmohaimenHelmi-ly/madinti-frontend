"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";

import DeliveryPageHeader from "@/components/delivery/DeliveryPageHeader";
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

  // Active filters (sent to API)
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Draft inputs (only push to active filters on Apply / Enter)
  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await deliveryApi.orders({
        page,
        per_page: 15,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
        ...(city ? { city } : {}),
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
  }, [page, statusFilter, search, city, fromDate, toDate, t]);

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

  const statusChips: Array<{ value: string; label: string }> = [
    { value: "", label: t("filterAll") },
    { value: "pending", label: statusLabel.pending },
    { value: "processing", label: statusLabel.processing },
    { value: "shipped", label: statusLabel.shipped },
    { value: "delivered", label: statusLabel.delivered },
    { value: "cancelled", label: statusLabel.cancelled },
  ];

  const applyFilters = () => {
    setSearch(searchInput.trim());
    setCity(cityInput.trim());
    setFromDate(fromDateInput);
    setToDate(toDateInput);
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("");
    setSearch("");
    setCity("");
    setFromDate("");
    setToDate("");
    setSearchInput("");
    setCityInput("");
    setFromDateInput("");
    setToDateInput("");
    setPage(1);
  };

  const activeFiltersCount =
    (statusFilter ? 1 : 0) +
    (search ? 1 : 0) +
    (city ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0);

  return (
    <Box>
      <DeliveryPageHeader title={t("orders")} subtitle={t("ordersSubtitle")} />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mb: 2 }}
        >
          <FilterAltIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t("filters")}
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              size="small"
              label={activeFiltersCount}
              color="primary"
              sx={{ height: 20, fontWeight: 700 }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {activeFiltersCount > 0 && (
            <Tooltip title={t("clearFilters")}>
              <IconButton size="small" onClick={resetFilters}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {t("status")}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}
        >
          {statusChips.map((s) => (
            <Chip
              key={s.value || "all"}
              label={s.label}
              clickable
              color={statusFilter === s.value ? "primary" : "default"}
              variant={statusFilter === s.value ? "filled" : "outlined"}
              onClick={() => {
                setStatusFilter(s.value);
                setPage(1);
              }}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { xs: "stretch", md: "flex-end" } }}
        >
          <TextField
            size="small"
            label={t("searchOrderNumber")}
            placeholder={t("searchOrderNumberPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                ),
              },
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            size="small"
            label={t("filterCity")}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            sx={{ flex: 1, minWidth: 160 }}
          />
          <TextField
            size="small"
            label={t("fromDate")}
            type="date"
            value={fromDateInput}
            onChange={(e) => setFromDateInput(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            size="small"
            label={t("toDate")}
            type="date"
            value={toDateInput}
            onChange={(e) => setToDateInput(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="contained"
            onClick={applyFilters}
            sx={{ height: 40, whiteSpace: "nowrap" }}
          >
            {t("applyFilters")}
          </Button>
        </Stack>
      </Paper>

      {!loading && (
        <Stack direction="row" sx={{ mb: 1.5, alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {total} {t("orders").toLowerCase()}
          </Typography>
        </Stack>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={6} />
      ) : orders.length === 0 ? (
        <EmptyState message={t("noOrders")} />
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}
          >
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
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          #{o.order_number}
                        </Typography>
                      </TableCell>
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
        </>
      )}
    </Box>
  );
}

