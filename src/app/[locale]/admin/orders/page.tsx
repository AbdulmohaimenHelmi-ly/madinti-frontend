"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { adminApi } from "@/lib/api/admin";
import type { Order } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

const STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type Status = (typeof STATUSES)[number];

const statusColor: Record<
  Status,
  "warning" | "info" | "primary" | "success" | "error" | "default"
> = {
  pending: "warning",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "error",
  refunded: "default",
};

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tOrder = useTranslations("order");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | Status>("");
  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<Status>("pending");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: 15, page };
      if (status) params.status = status;
      const res = await adminApi.getOrders(params);
      setOrders(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [status, t, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openOrder = async (id: number) => {
    try {
      const res = await adminApi.getOrder(id);
      setViewOrder(res.data.data);
      setNewStatus(res.data.data.status as Status);
    } catch {
      setError(t("loadError"));
    }
  };

  const saveStatus = async () => {
    if (!viewOrder) return;
    try {
      await adminApi.updateOrderStatus(viewOrder.id, newStatus);
      setSnack(t("updated"));
      setViewOrder(null);
      load();
    } catch {
      setError(t("actionError"));
    }
  };

  const shippingAddressLabel = (order: Order) => {
    if (typeof order.shipping_address === "string") {
      return `${order.shipping_address}${order.shipping_city ? ", " + order.shipping_city : ""}`;
    }

    const address = order.shipping_address?.address ?? "";
    const city = order.shipping_address?.city ?? "";
    return `${address}${city ? ", " + city : ""}`;
  };

  return (
    <Box>
      <AdminPageHeader title={t("orders")} subtitle={t("ordersSubtitle")} />

      <AdminToolbar
        selects={[
          {
            key: "status",
            label: tOrder("status"),
            value: status,
            options: [
              { value: "", label: t("allStatuses") },
              ...STATUSES.map((s) => ({ value: s, label: tOrder(`statuses.${s}`) })),
            ],
            onChange: (v) => setStatus(v as "" | Status),
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={6} />
      ) : orders.length === 0 ? (
        <EmptyState message={tOrder("noOrders")} />
      ) : (
        <>
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tOrder("orderNumber")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("storeName")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{tOrder("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCommon("total")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{tOrder("date")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => {
                const rich = o as Order & {
                  user?: { id: number; name: string; email: string };
                  vendor?: { id: number; store_name: string } | null;
                };
                return (
                  <TableRow key={o.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      #{o.order_number}
                    </TableCell>
                    <TableCell>{rich.user?.name ?? "—"}</TableCell>
                    <TableCell>{rich.vendor?.store_name ?? "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={statusColor[o.status as Status]}
                        label={tOrder(`statuses.${o.status}`)}
                      />
                    </TableCell>
                    <TableCell>
                      {Number(o.total).toFixed(2)} {tCommon("currency")}
                    </TableCell>
                    <TableCell>
                      {new Date(o.created_at).toLocaleDateString(
                        locale === "ar" ? "ar-LY" : "en-US"
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-start" }}
                      >
                        <Tooltip title={tCommon("view")}>
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/${locale}/orders/${o.id}`}
                            target="_blank"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tCommon("edit")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openOrder(o.id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
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

      <Dialog
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        {viewOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              #{viewOrder.order_number}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <span>{tCommon("total")}</span>
                    <strong>
                      {Number(viewOrder.total).toFixed(2)} {tCommon("currency")}
                    </strong>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <span>{tOrder("shippingAddress")}</span>
                    <span>{shippingAddressLabel(viewOrder)}</span>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <span>{tOrder("phone")}</span>
                    <span>{viewOrder.shipping_phone}</span>
                  </Box>
                </Box>

                <TextField
                  select
                  fullWidth
                  label={tOrder("status")}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Status)}
                >
                  {STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {tOrder(`statuses.${s}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setViewOrder(null)}>
                {tCommon("cancel")}
              </Button>
              <Button variant="contained" onClick={saveStatus}>
                {tCommon("save")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnack("")}>
          {snack}
        </Alert>
      </Snackbar>
    </Box>
  );
}
