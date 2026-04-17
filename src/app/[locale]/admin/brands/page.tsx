"use client";

import { useCallback, useEffect, useState } from "react";
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
import MenuItem from "@mui/material/MenuItem";

import { adminApi, type BrandPayload } from "@/lib/api/admin";
import type { Brand, ContentType } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState {
  name: string;
  name_en: string;
  logo: string;
  description: string;
  description_en: string;
  sort_order: string;
  is_active: boolean;
  is_featured: boolean;
  content_type: ContentType;
}

const emptyForm: FormState = {
  name: "",
  name_en: "",
  logo: "",
  description: "",
  description_en: "",
  sort_order: "0",
  is_active: true,
  is_featured: false,
  content_type: "unisex",
};

export default function AdminBrandsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const uiLocale = useLocale();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const audienceOptions = useAudienceOptions(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState<Brand | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.getBrands(params);
      setBrands(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.name,
      name_en: b.name_en ?? "",
      logo: b.logo ?? "",
      description: b.description ?? "",
      description_en: b.description_en ?? "",
      sort_order: String(b.sort_order ?? 0),
      is_active: b.is_active,
      is_featured: b.is_featured,
      content_type: b.content_type ?? "unisex",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload: BrandPayload = {
        name: form.name,
        name_en: form.name_en || null,
        logo: form.logo || null,
        description: form.description || null,
        description_en: form.description_en || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        is_featured: form.is_featured,
        content_type: form.content_type,
      };
      if (editing) {
        await adminApi.updateBrand(editing.id, payload);
        setSnackbar(t("updated"));
      } else {
        await adminApi.createBrand(payload);
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
      await adminApi.deleteBrand(toDelete.id);
      setSnackbar(t("deleted"));
      setToDelete(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDelete(null);
    }
  };

  const brandLabel = (b: Brand) =>
    uiLocale === "en" && b.name_en ? b.name_en : b.name;

  return (
    <Box>
      <AdminPageHeader
        title={t("brands")}
        subtitle={t("brandsSubtitle")}
        action={{
          label: t("newBrand"),
          icon: <AddIcon />,
          onClick: openCreate,
        }}
      />

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260 }}
          />
          <TextField
            select
            label={tContent("contentType")}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            {audienceOptions.map((o) => (
              <MenuItem key={o.value || "all"} value={o.value}>
                {o.label}
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
        <TableRowsSkeleton rows={8} columns={4} />
      ) : brands.length === 0 ? (
        <EmptyState message={t("noBrands")} />
      ) : (
        (() => {
          const filteredBrands = audience
            ? brands.filter((b) => (b.content_type ?? "unisex") === audience)
            : brands;
          if (filteredBrands.length === 0) {
            return <EmptyState message={t("noBrands")} />;
          }
          return (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("logo")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("nameEn")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("slug")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("productsCount")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("sortOrder")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tContent("contentType")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("featured")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell align="end" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrands.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>
                    <Avatar
                      src={b.logo || undefined}
                      variant="rounded"
                      sx={{ width: 40, height: 40, bgcolor: "grey.100" }}
                    >
                      {brandLabel(b).charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {brandLabel(b)}
                  </TableCell>
                  <TableCell>{b.name_en || "—"}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", color: "text.secondary" }}
                    >
                      {b.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{b.products_count ?? 0}</TableCell>
                  <TableCell>{b.sort_order}</TableCell>
                  <TableCell>
                    <AudienceChip value={b.content_type} />
                  </TableCell>
                  <TableCell>
                    {b.is_featured ? (
                      <Chip
                        size="small"
                        color="warning"
                        label={t("featured")}
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={b.is_active ? "success" : "default"}
                      label={b.is_active ? t("active") : t("inactive")}
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
                        onClick={() => openEdit(b)}
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setToDelete(b)}
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
          );
        })()
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editing ? t("editBrand") : t("newBrand")}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
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
            <TextField
              label={t("logoUrl")}
              value={form.logo}
              onChange={(e) =>
                setForm((f) => ({ ...f, logo: e.target.value }))
              }
              fullWidth
              size="small"
              placeholder="https://..."
            />
            {form.logo && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Avatar
                  src={form.logo}
                  variant="rounded"
                  sx={{ width: 48, height: 48 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {t("logoPreview")}
                </Typography>
              </Paper>
            )}
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
              label={t("descriptionEn")}
              value={form.description_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, description_en: e.target.value }))
              }
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
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
            <TextField
              label={tContent("contentType")}
              select
              value={form.content_type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  content_type: e.target.value as ContentType,
                }))
              }
              helperText={tContent("contentTypeHint")}
              fullWidth
              size="small"
            >
              <MenuItem value="unisex">{tContent("unisex")}</MenuItem>
              <MenuItem value="female">{tContent("female")}</MenuItem>
              <MenuItem value="male">{tContent("male")}</MenuItem>
            </TextField>
            <Stack direction="row" spacing={3}>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_featured: e.target.checked }))
                    }
                  />
                }
                label={t("featured")}
              />
            </Stack>
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
            {t("confirmDeleteBrand", {
              name: toDelete ? brandLabel(toDelete) : "",
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
