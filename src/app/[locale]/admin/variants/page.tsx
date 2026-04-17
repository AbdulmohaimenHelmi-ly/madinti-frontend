"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { adminApi, type CatalogVariantPayload } from "@/lib/api/admin";
import type { Variant, ProductVariantType } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const TYPES: ProductVariantType[] = [
  "color",
  "size",
  "material",
  "style",
  "other",
];

interface FormState {
  type: ProductVariantType;
  name: string;
  name_en: string;
  hex_color: string;
  sort_order: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  type: "color",
  name: "",
  name_en: "",
  hex_color: "#000000",
  sort_order: "0",
  is_active: true,
};

const isValidHex = (hex: string) =>
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(hex);

export default function AdminVariantsCatalogPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale();

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");

  const [typeFilter, setTypeFilter] = useState<ProductVariantType | "">("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Variant | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      const res = await adminApi.getVariantCatalog(params);
      setVariants(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (v: Variant) => {
    setEditing(v);
    setForm({
      type: v.type,
      name: v.name,
      name_en: v.name_en ?? "",
      hex_color: v.hex_color ?? "#000000",
      sort_order: String(v.sort_order ?? 0),
      is_active: v.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    if (form.type === "color" && !isValidHex(form.hex_color)) {
      setFormError(t("invalidHex"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: CatalogVariantPayload = {
        type: form.type,
        name: form.name,
        name_en: form.name_en || null,
        hex_color: form.type === "color" ? form.hex_color : null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editing) {
        await adminApi.updateCatalogVariant(editing.id, payload);
        setSnackbar(t("updated"));
      } else {
        await adminApi.createCatalogVariant(payload);
        setSnackbar(t("created"));
      }
      setDialogOpen(false);
      await load();
    } catch {
      setFormError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await adminApi.deleteCatalogVariant(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const variantLabel = (v: Variant) =>
    uiLocale === "en" && v.name_en ? v.name_en : v.name;

  const renderValue = (v: Variant) => {
    if (v.type === "color" && v.hex_color) {
      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: v.hex_color,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {v.hex_color.toUpperCase()}
          </Typography>
        </Stack>
      );
    }
    return <Typography variant="body2">—</Typography>;
  };

  const sortedVariants = useMemo(
    () =>
      [...variants].sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.sort_order - b.sort_order ||
          a.name.localeCompare(b.name)
      ),
    [variants]
  );

  return (
    <Box>
      <AdminPageHeader
        title={t("variantsCatalog")}
        subtitle={t("variantsCatalogSubtitle")}
        action={{
          label: t("newCatalogVariant"),
          icon: <AddIcon />,
          onClick: openCreate,
        }}
      />

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            label={t("variantType")}
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as ProductVariantType | "")
            }
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">{t("allTypes")}</MenuItem>
            {TYPES.map((ty) => (
              <MenuItem key={ty} value={ty}>
                {t(`variantTypes.${ty}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={6} columns={4} />
      ) : sortedVariants.length === 0 ? (
        <EmptyState message={t("noCatalogVariants")} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("variantType")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("nameEn")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("value")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("sortOrder")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell align="end" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedVariants.map((v) => (
                <TableRow key={v.id} hover>
                  <TableCell>
                    <Chip
                      size="small"
                      label={t(`variantTypes.${v.type}`)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {variantLabel(v)}
                  </TableCell>
                  <TableCell>{v.name_en || "—"}</TableCell>
                  <TableCell>{renderValue(v)}</TableCell>
                  <TableCell>{v.sort_order}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={v.is_active ? "success" : "default"}
                      label={v.is_active ? t("active") : t("inactive")}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="end">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
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
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? t("editCatalogVariant") : t("newCatalogVariant")}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={t("variantType")}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as ProductVariantType,
                }))
              }
              fullWidth
              size="small"
            >
              {TYPES.map((ty) => (
                <MenuItem key={ty} value={ty}>
                  {t(`variantTypes.${ty}`)}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("name")}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label={t("nameEn")}
                value={form.name_en}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name_en: e.target.value }))
                }
                fullWidth
                size="small"
              />
            </Stack>

            {form.type === "color" && (
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label={t("hexColor")}
                  value={form.hex_color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex_color: e.target.value }))
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: isValidHex(form.hex_color)
                                ? form.hex_color
                                : "grey.300",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            {" "}
                          </Avatar>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Box
                  component="input"
                  type="color"
                  value={
                    isValidHex(form.hex_color) ? form.hex_color : "#000000"
                  }
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hex_color: (e.target as HTMLInputElement).value,
                    }))
                  }
                  sx={{
                    width: 44,
                    height: 40,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 0,
                    cursor: "pointer",
                    bgcolor: "transparent",
                  }}
                />
              </Stack>
            )}

            <TextField
              label={t("sortOrder")}
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: e.target.value }))
              }
              fullWidth
              size="small"
            />
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
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
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
            {t("confirmDeleteVariant", {
              name: toDelete ? variantLabel(toDelete) : "",
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
