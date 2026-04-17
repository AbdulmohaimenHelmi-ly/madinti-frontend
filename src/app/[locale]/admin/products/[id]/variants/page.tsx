"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
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
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { adminApi, type AttachVariantPayload } from "@/lib/api/admin";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductVariant, Variant } from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import EmptyState from "@/components/common/EmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface PivotFormState {
  variant_id: number | "";
  sku: string;
  price_adjustment: string;
  quantity: string;
  image: string;
  is_active: boolean;
}

const emptyForm: PivotFormState = {
  variant_id: "",
  sku: "",
  price_adjustment: "0",
  quantity: "0",
  image: "",
  is_active: true,
};

export default function AdminProductVariantsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const uiLocale = useLocale();

  const productId = Number(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [attached, setAttached] = useState<ProductVariant[]>([]);
  const [catalog, setCatalog] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [form, setForm] = useState<PivotFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toDetach, setToDetach] = useState<ProductVariant | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prod, vars, cat] = await Promise.all([
        productsApi.getById(productId),
        adminApi.getProductVariants(productId),
        adminApi.getVariantCatalog({ is_active: 1 }),
      ]);
      setProduct(prod.data.data);
      setAttached(vars.data.data);
      setCatalog(cat.data.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const attachedIds = useMemo(
    () => new Set(attached.map((v) => v.id)),
    [attached]
  );

  const availableCatalog = useMemo(
    () => catalog.filter((v) => !attachedIds.has(v.id)),
    [catalog, attachedIds]
  );

  const openAttach = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (v: ProductVariant) => {
    setEditing(v);
    setForm({
      variant_id: v.id,
      sku: v.sku ?? "",
      price_adjustment: String(v.price_adjustment ?? 0),
      quantity: String(v.quantity ?? 0),
      image: v.image ?? "",
      is_active: v.is_active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing && !form.variant_id) {
      setFormError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const pivot = {
        sku: form.sku || null,
        price_adjustment: Number(form.price_adjustment) || 0,
        quantity: Number(form.quantity) || 0,
        image: form.image || null,
        is_active: form.is_active,
      };
      if (editing) {
        await adminApi.updateProductVariant(productId, editing.id, pivot);
        setSnackbar(t("updated"));
      } else {
        const payload: AttachVariantPayload = {
          variant_id: Number(form.variant_id),
          ...pivot,
        };
        await adminApi.attachProductVariant(productId, payload);
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

  const handleDetach = async () => {
    if (!toDetach) return;
    try {
      await adminApi.detachProductVariant(productId, toDetach.id);
      setSnackbar(t("deleted"));
      setToDetach(null);
      await load();
    } catch {
      setError(t("actionError"));
      setToDetach(null);
    }
  };

  const productName = useMemo(() => {
    if (!product) return "";
    return uiLocale === "en" && product.name_en
      ? product.name_en
      : product.name;
  }, [product, uiLocale]);

  const variantLabel = (v: { name: string; name_en: string | null }) =>
    uiLocale === "en" && v.name_en ? v.name_en : v.name;

  const renderValue = (v: ProductVariant | Variant) => {
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

  return (
    <Box>
      <Button
        component={Link}
        href={`/${locale}/admin/products`}
        startIcon={
          <ArrowBackIcon
            sx={{ transform: uiLocale === "ar" ? "scaleX(-1)" : "none" }}
          />
        }
        sx={{ mb: 2 }}
      >
        {t("backToProducts")}
      </Button>

      <AdminPageHeader
        title={t("productVariants")}
        subtitle={productName || t("variantsSubtitle")}
        action={{
          label: t("attachVariant"),
          icon: <AddIcon />,
          onClick: openAttach,
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableRowsSkeleton rows={6} columns={5} />
      ) : attached.length === 0 ? (
        <EmptyState message={t("noVariants")} />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("variantType")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("name")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("value")}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("priceAdjustment")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {tCommon("quantity")}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                <TableCell align="end" sx={{ fontWeight: 700 }}>
                  {t("actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attached.map((v) => (
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
                  <TableCell>{renderValue(v)}</TableCell>
                  <TableCell>{v.sku || "—"}</TableCell>
                  <TableCell>
                    {v.price_adjustment > 0 ? "+" : ""}
                    {v.price_adjustment} {tCommon("currency")}
                  </TableCell>
                  <TableCell>{v.quantity}</TableCell>
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
                        startIcon={<RemoveCircleOutlineIcon />}
                        onClick={() => setToDetach(v)}
                      >
                        {t("detach")}
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
          {editing ? t("editAttachedVariant") : t("attachVariant")}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editing &&
              (availableCatalog.length === 0 ? (
                <Alert severity="info">{t("noAvailableVariants")}</Alert>
              ) : (
                <TextField
                  select
                  label={t("pickVariant")}
                  value={form.variant_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      variant_id: Number(e.target.value),
                    }))
                  }
                  fullWidth
                  size="small"
                >
                  {availableCatalog.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {v.type === "color" && v.hex_color && (
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              bgcolor: v.hex_color,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        )}
                        <Typography variant="body2">
                          [{t(`variantTypes.${v.type}`)}] {variantLabel(v)}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              ))}

            {editing && (
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2, bgcolor: "background.default" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={t(`variantTypes.${editing.type}`)}
                  />
                  <Typography sx={{ fontWeight: 600 }}>
                    {variantLabel(editing)}
                  </Typography>
                  {editing.type === "color" && editing.hex_color && (
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        bgcolor: editing.hex_color,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  )}
                </Stack>
              </Paper>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="SKU"
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                fullWidth
                size="small"
              />
              <TextField
                label={tCommon("quantity")}
                type="number"
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                }
                fullWidth
                size="small"
              />
            </Stack>
            <TextField
              label={t("priceAdjustment")}
              type="number"
              value={form.price_adjustment}
              onChange={(e) =>
                setForm((f) => ({ ...f, price_adjustment: e.target.value }))
              }
              fullWidth
              size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {tCommon("currency")}
                    </InputAdornment>
                  ),
                },
              }}
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
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              saving ||
              (!editing && (!form.variant_id || availableCatalog.length === 0))
            }
          >
            {editing ? tCommon("save") : t("attach")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!toDetach} onClose={() => setToDetach(null)}>
        <DialogTitle>{t("confirmDeleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("confirmDetachVariant", {
              name: toDetach ? variantLabel(toDetach) : "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDetach(null)}>{tCommon("cancel")}</Button>
          <Button onClick={handleDetach} color="error" variant="contained">
            {t("detach")}
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
