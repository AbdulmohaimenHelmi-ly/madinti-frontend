"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";

import { adminApi, type UpdateVendorPayload } from "@/lib/api/admin";
import { citiesApi, type Area, type City } from "@/lib/api/cities";
import type { Vendor } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import DataPagination from "@/components/common/DataPagination";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";

interface EditForm {
  store_name: string;
  store_name_en: string;
  phone: string;
  description: string;
  description_en: string;
  city_id: string;
  area_id: string;
}

export default function AdminVendorsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Vendor | null>(null);
  const [snackbar, setSnackbar] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [cityId, setCityId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cities, setCities] = useState<City[]>([]);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<EditForm>({
    store_name: "",
    store_name_en: "",
    phone: "",
    description: "",
    description_en: "",
    city_id: "",
    area_id: "",
  });
  const [formAreas, setFormAreas] = useState<Area[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    citiesApi
      .list({ all: true })
      .then((res) => setCities(res.data.data))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        per_page: 15,
        page,
        all: 1,
      };
      if (search) params.search = search;
      if (status !== "") params.is_active = status;
      if (cityId !== "") params.city_id = cityId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await adminApi.getVendors(params);
      setVendors(res.data.data);
      setLastPage(res.data.meta.last_page);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, search, status, cityId, dateFrom, dateTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (v: Vendor) => {
    setBusyId(v.id);
    try {
      if (v.is_active) {
        await adminApi.deactivateVendor(v.id);
        setSnackbar(t("deactivated"));
      } else {
        await adminApi.activateVendor(v.id);
        setSnackbar(t("activated"));
      }
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteVendor(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const storeName = (v: Vendor) =>
    locale === "en" && v.store_name_en ? v.store_name_en : v.store_name;

  const openEdit = async (v: Vendor) => {
    setEditing(v);
    setFormError("");
    setForm({
      store_name: v.store_name,
      store_name_en: v.store_name_en ?? "",
      phone: v.phone ?? "",
      description: v.description ?? "",
      description_en: v.description_en ?? "",
      city_id: v.city_id ? String(v.city_id) : "",
      area_id: v.area_id ? String(v.area_id) : "",
    });
    setFormAreas([]);
    if (v.city_id) {
      try {
        const res = await citiesApi.areasOf(v.city_id, { all: true });
        setFormAreas(res.data.data);
      } catch {
        /* noop */
      }
    }
  };

  const handleFormCityChange = async (value: string) => {
    setForm((f) => ({ ...f, city_id: value, area_id: "" }));
    setFormAreas([]);
    if (value) {
      try {
        const res = await citiesApi.areasOf(Number(value), { all: true });
        setFormAreas(res.data.data);
      } catch {
        /* noop */
      }
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!form.store_name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: UpdateVendorPayload = {
        store_name: form.store_name,
        store_name_en: form.store_name_en || undefined,
        phone: form.phone || undefined,
        description: form.description || undefined,
        description_en: form.description_en || undefined,
        city_id: form.city_id ? Number(form.city_id) : null,
        area_id: form.area_id ? Number(form.area_id) : null,
      };
      await adminApi.updateVendor(editing.id, payload);
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

  const cityLabel = (c: City) =>
    locale === "en" && c.name_en ? c.name_en : c.name;
  const areaLabel = (a: Area) =>
    locale === "en" && a.name_en ? a.name_en : a.name;

  return (
    <Box>
      <AdminPageHeader title={t("vendors")} subtitle={t("vendorsSubtitle")} />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchVendors")}
        selects={[
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
          {
            key: "city",
            label: t("city"),
            value: cityId,
            onChange: setCityId,
            options: [
              { value: "", label: t("allCities") },
              ...cities.map((c) => ({
                value: String(c.id),
                label: cityLabel(c),
              })),
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
      ) : vendors.length === 0 ? (
        <EmptyState message={t("noVendors")} />
      ) : (
        <>
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("storeName")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("city")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("phone")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("joinedAt")}</TableCell>
                <TableCell align="end" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{storeName(v)}</TableCell>
                  <TableCell>
                    {v.city_details
                      ? v.city_details.name
                      : v.city || "—"}
                  </TableCell>
                  <TableCell>{v.phone || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={v.is_active ? "success" : "default"}
                      label={v.is_active ? t("active") : t("inactive")}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(v.created_at)}</TableCell>
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
                        onClick={() => openEdit(v)}
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busyId === v.id}
                        color={v.is_active ? "warning" : "success"}
                        startIcon={
                          v.is_active ? <BlockIcon /> : <CheckCircleIcon />
                        }
                        onClick={() => handleToggleActive(v)}
                      >
                        {v.is_active ? t("deactivate") : t("activate")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setToDelete(v)}
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
          perPage={15}
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
        <DialogTitle>{t("editVendor")}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("storeName")}
              value={form.store_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, store_name: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t("nameEn")}
              value={form.store_name_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, store_name_en: e.target.value }))
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
              label={t("city")}
              value={form.city_id}
              onChange={(e) => handleFormCityChange(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="">—</MenuItem>
              {cities.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {cityLabel(c)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("area")}
              value={form.area_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, area_id: e.target.value }))
              }
              fullWidth
              size="small"
              disabled={!form.city_id}
            >
              <MenuItem value="">—</MenuItem>
              {formAreas.map((a) => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {areaLabel(a)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("description")}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
            <TextField
              label={`${t("description")} (EN)`}
              value={form.description_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, description_en: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              minRows={2}
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
            {t("confirmDeleteVendor", {
              name: toDelete ? storeName(toDelete) : "",
            })}
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
