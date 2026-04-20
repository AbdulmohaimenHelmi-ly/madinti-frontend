"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { adminApi, type CreateCategoryPayload } from "@/lib/api/admin";
import type { Category, ContentType } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminToolbar from "@/components/admin/AdminToolbar";
import AudienceChip, { useAudienceOptions } from "@/components/common/AudienceChip";

interface FormState extends CreateCategoryPayload {
  id?: number;
}

const emptyForm: FormState = {
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  parent_id: null,
  sort_order: 0,
  is_active: true,
  content_type: "unisex",
};

export default function AdminCategoriesPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tContent = useTranslations("content");
  const locale = useLocale();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [audience, setAudience] = useState("");
  const audienceOptions = useAudienceOptions(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const parentOptions = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setForm({
      id: c.id,
      name: c.name,
      name_en: c.name_en ?? "",
      description: c.description ?? "",
      description_en: "",
      parent_id: c.parent_id,
      is_active: c.is_active,
      sort_order: 0,
      content_type: c.content_type ?? "unisex",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload: CreateCategoryPayload = {
        name: form.name,
        name_en: form.name_en || undefined,
        description: form.description || undefined,
        description_en: form.description_en || undefined,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        content_type: form.content_type,
      };
      if (form.id) {
        await adminApi.updateCategory(form.id, payload);
        setSnackbar(t("updated"));
      } else {
        await adminApi.createCategory(payload);
        setSnackbar(t("created"));
      }
      setFormOpen(false);
      await load();
    } catch {
      setError(t("actionError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(t("confirmDeleteCategory", { name: c.name }))) return;
    try {
      await adminApi.deleteCategory(c.id);
      setSnackbar(t("deleted"));
      await load();
    } catch {
      setError(t("actionError"));
    }
  };

  const displayName = (c: Category) =>
    locale === "en" && c.name_en ? c.name_en : c.name;

  const filteredCategories = categories.filter((c) => {
    if (status === "1" && !c.is_active) return false;
    if (status === "0" && c.is_active) return false;
    if (audience && (c.content_type ?? "unisex") !== audience) return false;
    if (search) {
      const q = search.toLowerCase();
      const n = displayName(c).toLowerCase();
      const a = (c.name || "").toLowerCase();
      const e = (c.name_en || "").toLowerCase();
      if (!n.includes(q) && !a.includes(q) && !e.includes(q)) return false;
    }
    return true;
  });

  return (
    <Box>
      <AdminPageHeader
        title={t("categories")}
        subtitle={t("categoriesSubtitle")}
        action={{
          label: t("newCategory"),
          icon: <AddIcon />,
          onClick: handleOpenCreate,
        }}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchCategories")}
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
            key: "audience",
            label: tContent("contentType"),
            value: audience,
            onChange: setAudience,
            options: audienceOptions,
          },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={8} columns={4} />
      ) : filteredCategories.length === 0 ? (
        <EmptyState message={t("noCategories")} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("parent")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tContent("contentType")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCategories.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {displayName(c)}
                  </TableCell>
                  <TableCell>
                    {c.parent_id
                      ? displayName(
                          categories.find((p) => p.id === c.parent_id) ?? c
                        )
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    <AudienceChip value={c.content_type} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={c.is_active ? "success" : "default"}
                      label={c.is_active ? t("active") : t("inactive")}
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
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEdit(c)}
                      >
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(c)}
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
        open={formOpen}
        onClose={() => setFormOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {form.id ? t("editCategory") : t("newCategory")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t("nameAr")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t("nameEn")}
              value={form.name_en || ""}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("parent")}
              select
              value={form.parent_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  parent_id: e.target.value ? Number(e.target.value) : null,
                })
              }
              fullWidth
            >
              <MenuItem value="">{t("noParent")}</MenuItem>
              {parentOptions
                .filter((c) => c.id !== form.id)
                .map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {displayName(c)}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label={t("description")}
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label={tContent("contentType")}
              select
              value={form.content_type ?? "unisex"}
              onChange={(e) =>
                setForm({
                  ...form,
                  content_type: e.target.value as ContentType,
                })
              }
              helperText={tContent("contentTypeHint")}
              fullWidth
            >
              <MenuItem value="unisex">{tContent("unisex")}</MenuItem>
              <MenuItem value="female">{tContent("female")}</MenuItem>
              <MenuItem value="male">{tContent("male")}</MenuItem>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
              }
              label={t("active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{tCommon("cancel")}</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
          >
            {tCommon("save")}
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
