"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  vendorApplicationsApi,
  type VendorApplication,
} from "@/lib/api/vendorApplications";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

const statusColor = (s: VendorApplication["status"]) =>
  s === "approved" ? "success" : s === "rejected" ? "error" : "warning";

export default function AdminVendorApplicationsPage() {
  const t = useTranslations("admin");
  const tApp = useTranslations("vendorApplication");
  const tCommon = useTranslations("common");

  const [apps, setApps] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [viewApp, setViewApp] = useState<VendorApplication | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [actionTarget, setActionTarget] = useState<VendorApplication | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { per_page: 15, page };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await vendorApplicationsApi.list(params);
      setApps(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    if (!action || !actionTarget) return;
    setBusy(true);
    try {
      if (action === "approve") {
        await vendorApplicationsApi.approve(actionTarget.id, notes || undefined);
        setSnackbar(tApp("approved"));
      } else {
        await vendorApplicationsApi.reject(actionTarget.id, notes || undefined);
        setSnackbar(tApp("rejected"));
      }
      setAction(null);
      setActionTarget(null);
      setNotes("");
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <AdminPageHeader
        title={tApp("adminTitle")}
        subtitle={tApp("adminSubtitle")}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={tApp("searchPlaceholder")}
        selects={[
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "pending", label: tApp("status.pending") },
              { value: "approved", label: tApp("status.approved") },
              { value: "rejected", label: tApp("status.rejected") },
            ],
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={6} columns={5} />
      ) : apps.length === 0 ? (
        <EmptyState message={tApp("noApplications")} />
      ) : (
        <>
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tApp("storeName")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("email")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("city")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {a.store_name}
                  </TableCell>
                  <TableCell>{a.user?.name ?? "—"}</TableCell>
                  <TableCell>{a.user?.email ?? "—"}</TableCell>
                  <TableCell>{a.city_details?.name ?? a.city ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={statusColor(a.status)}
                      label={tApp(`status.${a.status}`)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setViewApp(a)}
                      >
                        {tCommon("view")}
                      </Button>
                      {a.status === "pending" && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            startIcon={<CheckIcon />}
                            onClick={() => {
                              setAction("approve");
                              setActionTarget(a);
                              setNotes("");
                            }}
                          >
                            {tApp("approve")}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => {
                              setAction("reject");
                              setActionTarget(a);
                              setNotes("");
                            }}
                          >
                            {tApp("reject")}
                          </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* View details */}
      <Dialog
        open={!!viewApp}
        onClose={() => setViewApp(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{tApp("applicationDetails")}</DialogTitle>
        <DialogContent dividers>
          {viewApp && (
            <Stack spacing={1.5}>
              <Row label={tApp("storeName")} value={viewApp.store_name} />
              {viewApp.store_name_en && (
                <Row label={tApp("storeNameEn")} value={viewApp.store_name_en} />
              )}
              {viewApp.user && (
                <>
                  <Row label={t("name")} value={viewApp.user.name} />
                  <Row label={t("email")} value={viewApp.user.email} />
                  <Row
                    label={t("phone")}
                    value={viewApp.user.phone ?? viewApp.phone ?? "—"}
                  />
                </>
              )}
              {(viewApp.city_details || viewApp.city) && (
                <Row
                  label={t("city")}
                  value={viewApp.city_details?.name ?? viewApp.city ?? ""}
                />
              )}
              {viewApp.area_details && (
                <Row label={tApp("area")} value={viewApp.area_details.name} />
              )}
              {viewApp.address && (
                <Row label={tApp("address")} value={viewApp.address} />
              )}
              {viewApp.description && (
                <Row
                  label={tApp("description")}
                  value={viewApp.description}
                />
              )}
              {viewApp.admin_notes && (
                <Row label={tApp("adminNotes")} value={viewApp.admin_notes} />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewApp(null)}>{tCommon("close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Approve/Reject confirmation with notes */}
      <Dialog
        open={!!action}
        onClose={() => {
          setAction(null);
          setActionTarget(null);
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {action === "approve" ? tApp("approveTitle") : tApp("rejectTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={tApp("adminNotes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAction(null);
              setActionTarget(null);
            }}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="contained"
            color={action === "approve" ? "success" : "error"}
            onClick={handleConfirm}
            disabled={busy}
          >
            {action === "approve" ? tApp("approve") : tApp("reject")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Box sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
        {label}
      </Box>
      <Box sx={{ fontSize: 15 }}>{value}</Box>
    </Box>
  );
}
