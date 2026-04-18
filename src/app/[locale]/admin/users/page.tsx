"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LoginIcon from "@mui/icons-material/Login";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";

import { adminApi, type UpdateUserPayload } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/authStore";
import type { User } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import DataPagination from "@/components/common/DataPagination";

const PER_PAGE = 15;

const roleColor = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "error" as const;
    case "vendor":
      return "warning" as const;
    default:
      return "info" as const;
  }
};

interface EditForm {
  name: string;
  email: string;
  phone: string;
  role: User["role"];
  is_active: boolean;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const startImpersonation = useAuthStore((s) => s.startImpersonation);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { per_page: PER_PAGE, page };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status !== "") params.is_active = status;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, role, status, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteUser(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const handleImpersonate = async (u: User) => {
    if (!confirm(t("confirmImpersonate", { name: u.name }))) return;
    try {
      const res = await adminApi.impersonateUser(u.id);
      const { token, user } = res.data.data;
      startImpersonation(token, user);
      router.push(`/${locale}`);
    } catch {
      setError(t("actionError"));
    }
  };

  const handleToggleActive = async (u: User) => {
    setBusyId(u.id);
    try {
      await adminApi.toggleUserActive(u.id);
      setSnackbar(u.is_active ? t("deactivated") : t("activated"));
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setFormError("");
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      role: u.role,
      is_active: u.is_active,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: UpdateUserPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        is_active: form.is_active,
      };
      await adminApi.updateUser(editing.id, payload);
      setSnackbar(t("updated"));
      setEditing(null);
      await load();
    } catch {
      setFormError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(
        locale === "ar" ? "ar-LY" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      );
    } catch {
      return "—";
    }
  };

  return (
    <Box>
      <AdminPageHeader title={t("users")} subtitle={t("usersSubtitle")} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchUsers")}
        selects={[
          {
            key: "role",
            label: t("role"),
            value: role,
            onChange: setRole,
            options: [
              { value: "", label: t("allRoles") },
              { value: "customer", label: t("roles.customer") },
              { value: "vendor", label: t("roles.vendor") },
              { value: "admin", label: t("roles.admin") },
            ],
          },
          {
            key: "status",
            label: t("status"),
            value: status,
            onChange: setStatus,
            options: [
              { value: "", label: t("allStatuses") },
              { value: "1", label: t("active") },
              { value: "0", label: t("inactive") },
            ],
          },
        ]}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        dateFromLabel={t("dateFrom")}
        dateToLabel={t("dateTo")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={5} />
      ) : users.length === 0 ? (
        <EmptyState message={t("noUsers")} />
      ) : (
        <>
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("email")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("phone")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("role")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("joinedAt")}</TableCell>
                <TableCell align="end" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={roleColor(u.role)}
                      label={t(`roles.${u.role}`)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={u.is_active ? "success" : "default"}
                      label={u.is_active ? t("active") : t("inactive")}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell align="end">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openEdit(u)}
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busyId === u.id || u.is_admin}
                        color={u.is_active ? "warning" : "success"}
                        startIcon={
                          u.is_active ? <BlockIcon /> : <CheckCircleIcon />
                        }
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? t("deactivate") : t("activate")}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<LoginIcon />}
                        disabled={u.is_admin}
                        onClick={() => handleImpersonate(u)}
                      >
                        {t("loginAs")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        disabled={u.is_admin}
                        onClick={() => setToDelete(u)}
                      >
                        {tCommon("delete")}
                      </Button>
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
          perPage={PER_PAGE}
          onChange={setPage}
        />
        </>
      )}

      <Dialog
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("editUser")}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("name")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label={t("email")}
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t("phone")}
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              select
              label={t("role")}
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as User["role"],
                }))
              }
              fullWidth
              size="small"
            >
              <MenuItem value="customer">{t("roles.customer")}</MenuItem>
              <MenuItem value="vendor">{t("roles.vendor")}</MenuItem>
              <MenuItem value="admin">{t("roles.admin")}</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
              }
              label={form.is_active ? t("active") : t("inactive")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {tCommon("save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmDeleteUser", { name: toDelete?.name ?? "" })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>{tCommon("cancel")}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {tCommon("delete")}
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
