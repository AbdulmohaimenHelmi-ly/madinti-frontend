"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import { vendorApi } from "@/lib/api/vendor";
import { productsApi } from "@/lib/api/products";
import type { SaveVariantPayload } from "@/lib/api/admin";
import type {
  Brand,
  Category,
  ContentType,
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@/lib/types";
import { TableRowsSkeleton } from "@/components/common/Skeletons";
import VendorPageHeader from "@/components/vendor/VendorPageHeader";
import { useAudienceOptions } from "@/components/common/AudienceChip";

interface ProductFormState {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  price: string;
  compare_price: string;
  sku: string;
  quantity: string;
  category_id: number | "";
  brand_id: number | "";
  content_type: ContentType;
  is_active: boolean;
  is_featured: boolean;
  has_variants: boolean;
}

const emptyForm = (): ProductFormState => ({
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  price: "",
  compare_price: "",
  sku: "",
  quantity: "",
  category_id: "",
  brand_id: "",
  content_type: "unisex",
  is_active: true,
  is_featured: false,
  has_variants: false,
});

const toForm = (p: Product): ProductFormState => ({
  name: p.name ?? "",
  name_en: p.name_en ?? "",
  description: p.description ?? "",
  description_en: p.description_en ?? "",
  price: String(p.price ?? ""),
  compare_price:
    p.compare_price !== null && p.compare_price !== undefined
      ? String(p.compare_price)
      : "",
  sku: p.sku ?? "",
  quantity: String(p.quantity ?? ""),
  category_id: p.category_id ?? "",
  brand_id: p.brand_id ?? "",
  content_type: (p.content_type as ContentType) ?? "unisex",
  is_active: !!p.is_active,
  is_featured: !!p.is_featured,
  has_variants: !!p.has_variants,
});

interface VariantDialogState {
  open: boolean;
  editingId: number | null;
  picks: Record<number, number>;
  sku: string;
  price: string;
  compare_price: string;
  quantity: string;
  is_active: boolean;
  is_default: boolean;
}

const emptyVariantDialog = (): VariantDialogState => ({
  open: false,
  editingId: null,
  picks: {},
  sku: "",
  price: "",
  compare_price: "",
  quantity: "0",
  is_active: true,
  is_default: false,
});

export default function VendorProductEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = use(params);
  const productId = Number(id);
  const t = useTranslations();
  const tVendor = useTranslations("vendor");
  const currentLocale = useLocale();
  const audienceOptions = useAudienceOptions(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{
    msg: string;
    sev: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [vDialog, setVDialog] = useState<VariantDialogState>(
    emptyVariantDialog()
  );
  const [savingVariant, setSavingVariant] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productRes, catsRes, brandsRes, optionsRes, variantsRes] =
        await Promise.all([
          productsApi.getById(productId),
          vendorApi.listCategories(),
          vendorApi.listBrands(),
          vendorApi.listOptions(),
          vendorApi.listVariants(productId),
        ]);
      const p = productRes.data.data;
      setProduct(p);
      setForm(toForm(p));
      setCategories(catsRes.data.data);
      setBrands(brandsRes.data.data);
      setAllOptions(optionsRes.data.data);
      setVariants(variantsRes.data.data);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProduct = async () => {
    setSaving(true);
    try {
      await vendorApi.updateProduct(productId, {
        name: form.name,
        name_en: form.name_en || null,
        description: form.description || null,
        description_en: form.description_en || null,
        price: form.has_variants ? 0 : Number(form.price || 0),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        sku: form.sku || null,
        quantity: form.has_variants ? 0 : Number(form.quantity || 0),
        category_id: form.category_id || undefined,
        brand_id: form.brand_id || null,
        content_type: form.content_type,
        is_active: form.is_active,
        is_featured: form.is_featured,
        has_variants: form.has_variants,
      });
      setSnack({ msg: tVendor("productSaved"), sev: "success" });
      load();
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ---------- Variant helpers (mirror admin page) ----------
  const optionLabel = (opt: ProductOption) =>
    currentLocale === "en" && opt.name_en ? opt.name_en : opt.name;
  const valueLabel = (val: ProductOptionValue) =>
    currentLocale === "en" && val.value_en ? val.value_en : val.value;

  const variantLabel = useMemo(() => {
    return (variant: ProductVariant): string => {
      if (!variant.option_value_ids?.length) return "—";
      const parts: string[] = [];
      for (const opt of allOptions) {
        const valId = variant.option_value_ids.find((id) =>
          opt.values.some((v) => v.id === id)
        );
        if (!valId) continue;
        const val = opt.values.find((v) => v.id === valId);
        if (val) parts.push(`${optionLabel(opt)}: ${valueLabel(val)}`);
      }
      return parts.join(" / ");
    };
  }, [allOptions, currentLocale]);

  // Suppress unused-variable warning while still keeping the helper available.
  void variantLabel;

  const openCreateVariant = () => {
    setVDialog({ ...emptyVariantDialog(), open: true });
  };

  const openEditVariant = (v: ProductVariant) => {
    const picks: Record<number, number> = {};
    for (const opt of allOptions) {
      const valId = v.option_value_ids.find((id) =>
        opt.values.some((vv) => vv.id === id)
      );
      if (valId) picks[opt.id] = valId;
    }
    setVDialog({
      open: true,
      editingId: v.id,
      picks,
      sku: v.sku ?? "",
      price: String(v.price),
      compare_price: v.compare_price !== null ? String(v.compare_price) : "",
      quantity: String(v.quantity),
      is_active: !!v.is_active,
      is_default: !!v.is_default,
    });
  };

  const closeVariantDialog = () => setVDialog((s) => ({ ...s, open: false }));

  const togglePick = (optionId: number, valueId: number) => {
    setVDialog((s) => {
      const next = { ...s.picks };
      if (next[optionId] === valueId) delete next[optionId];
      else next[optionId] = valueId;
      return { ...s, picks: next };
    });
  };

  const saveVariant = async () => {
    const ids = Object.values(vDialog.picks).filter((n): n is number =>
      Number.isFinite(n)
    );
    if (ids.length === 0) {
      setSnack({ msg: "Pick at least one option value.", sev: "error" });
      return;
    }
    if (!vDialog.price || Number(vDialog.price) < 0) {
      setSnack({ msg: "Enter a valid price.", sev: "error" });
      return;
    }
    const pickedSet = new Set(ids);
    const duplicate = variants.find(
      (v) =>
        v.id !== vDialog.editingId &&
        v.option_value_ids.length === pickedSet.size &&
        v.option_value_ids.every((id) => pickedSet.has(id))
    );
    if (duplicate) {
      setSnack({
        msg: t("admin.variantCombinationExists"),
        sev: "error",
      });
      return;
    }
    const payload: SaveVariantPayload = {
      option_value_ids: ids,
      sku: vDialog.sku || null,
      price: Number(vDialog.price),
      compare_price: vDialog.compare_price ? Number(vDialog.compare_price) : null,
      quantity: Number(vDialog.quantity || 0),
      is_active: vDialog.is_active,
      is_default: vDialog.is_default,
    };
    setSavingVariant(true);
    try {
      if (vDialog.editingId) {
        await vendorApi.updateVariant(productId, vDialog.editingId, payload);
      } else {
        await vendorApi.createVariant(productId, payload);
      }
      setSnack({ msg: "Variant saved", sev: "success" });
      closeVariantDialog();
      const [vRes, pRes] = await Promise.all([
        vendorApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
    } catch {
      setSnack({
        msg: "Could not save variant. Check option combination.",
        sev: "error",
      });
    } finally {
      setSavingVariant(false);
    }
  };

  const deleteVariant = async (v: ProductVariant) => {
    if (!confirm("Delete this variant?")) return;
    try {
      await vendorApi.deleteVariant(productId, v.id);
      const [vRes, pRes] = await Promise.all([
        vendorApi.listVariants(productId),
        productsApi.getById(productId),
      ]);
      setVariants(vRes.data.data);
      setProduct(pRes.data.data);
      setForm((f) => ({ ...f, has_variants: !!pRes.data.data.has_variants }));
      setSnack({ msg: "Variant deleted", sev: "success" });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  const setAsDefault = async (v: ProductVariant) => {
    if (v.is_default) return;
    try {
      await vendorApi.updateVariant(productId, v.id, {
        option_value_ids: v.option_value_ids,
        sku: v.sku,
        price: Number(v.price),
        compare_price: v.compare_price !== null ? Number(v.compare_price) : null,
        quantity: Number(v.quantity),
        image: v.image,
        is_active: v.is_active,
        is_default: true,
      });
      const vRes = await vendorApi.listVariants(productId);
      setVariants(vRes.data.data);
      setSnack({ msg: t("admin.defaultVariantSet"), sev: "success" });
    } catch {
      setSnack({ msg: t("common.error"), sev: "error" });
    }
  };

  const wouldDuplicate = (optionId: number, valueId: number): boolean => {
    if (vDialog.picks[optionId] === valueId) return false;
    const hypothetical: Record<number, number> = {
      ...vDialog.picks,
      [optionId]: valueId,
    };
    const ids = Object.values(hypothetical);
    if (ids.length !== allOptions.length) return false;
    const set = new Set(ids);
    return variants.some(
      (vv) =>
        vv.id !== vDialog.editingId &&
        vv.option_value_ids.length === set.size &&
        vv.option_value_ids.every((id) => set.has(id))
    );
  };

  const labelOf = (it: { name: string; name_en: string | null }) =>
    currentLocale === "en" && it.name_en ? it.name_en : it.name;

  return (
    <Box>
      <Button
        component={Link}
        href={`/${locale}/vendor/products`}
        startIcon={
          <ArrowBackIcon
            sx={{ transform: currentLocale === "ar" ? "scaleX(-1)" : "none" }}
          />
        }
        sx={{ mb: 2 }}
      >
        {tVendor("backToProducts")}
      </Button>

      <VendorPageHeader
        title={form.name || tVendor("editProduct")}
        subtitle={tVendor("editProductSubtitle")}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <TableRowsSkeleton rows={6} />
        </Paper>
      ) : (
        <Stack spacing={3}>
          {/* Basics */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {t("admin.basicInfo")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("admin.nameAr")}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("admin.nameEn")}
                  value={form.name_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name_en: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={tVendor("category")}
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category_id: Number(e.target.value) || "",
                    }))
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {labelOf(c)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t("admin.brand")}
                  value={form.brand_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      brand_id: Number(e.target.value) || "",
                    }))
                  }
                >
                  <MenuItem value="">{tVendor("none")}</MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {labelOf(b)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={tVendor("audience")}
                  value={form.content_type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      content_type: e.target.value as ContentType,
                    }))
                  }
                >
                  {audienceOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label={t("admin.descriptionAr")}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label={t("admin.descriptionEn")}
                  value={form.description_en}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description_en: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_active}
                      onChange={(_, v) =>
                        setForm((f) => ({ ...f, is_active: v }))
                      }
                    />
                  }
                  label={tVendor("active")}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_featured}
                      onChange={(_, v) =>
                        setForm((f) => ({ ...f, is_featured: v }))
                      }
                    />
                  }
                  label={tVendor("featured")}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Pricing & stock */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              sx={{
                mb: 2,
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("admin.pricingStock")}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.has_variants}
                    onChange={(_, v) =>
                      setForm((f) => ({ ...f, has_variants: v }))
                    }
                  />
                }
                label={t("admin.hasVariants")}
              />
            </Stack>
            {form.has_variants ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {t("admin.variantsManagedBelow")}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t("common.price")}
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            {t("common.currency")}
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t("admin.comparePrice")}
                    value={form.compare_price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, compare_price: e.target.value }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={t("common.quantity")}
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("admin.sku")}
                    value={form.sku}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sku: e.target.value }))
                    }
                  />
                </Grid>
              </Grid>
            )}
            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveProduct}
                disabled={saving}
              >
                {t("common.save")}
              </Button>
            </Box>
          </Paper>

          {/* Variants */}
          {form.has_variants && (
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                sx={{
                  mb: 2,
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t("admin.variants")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("admin.variantsHint")}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openCreateVariant}
                  disabled={allOptions.length === 0}
                >
                  {t("admin.addVariant")}
                </Button>
              </Stack>

              {allOptions.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  {t("admin.noGlobalOptions")}
                </Alert>
              )}

              {variants.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                  {t("admin.noVariantsYet")}
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ width: 56 }}>
                          {t("admin.default")}
                        </TableCell>
                        <TableCell>{t("admin.variant")}</TableCell>
                        <TableCell>{t("admin.sku")}</TableCell>
                        <TableCell align="right">
                          {t("admin.price")}
                        </TableCell>
                        <TableCell align="right">
                          {t("admin.quantity")}
                        </TableCell>
                        <TableCell align="center">
                          {t("admin.active")}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {variants.map((v) => (
                        <TableRow key={v.id} hover selected={v.is_default}>
                          <TableCell align="center">
                            <Tooltip
                              title={
                                v.is_default
                                  ? t("admin.isDefaultVariant")
                                  : t("admin.setAsDefault")
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => setAsDefault(v)}
                                  color={v.is_default ? "warning" : "default"}
                                  disabled={v.is_default}
                                >
                                  {v.is_default ? (
                                    <StarIcon fontSize="small" />
                                  ) : (
                                    <StarBorderIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                            >
                              {allOptions.map((opt) => {
                                const valId = v.option_value_ids.find((id) =>
                                  opt.values.some((vv) => vv.id === id)
                                );
                                if (!valId) return null;
                                const val = opt.values.find(
                                  (vv) => vv.id === valId
                                );
                                if (!val) return null;
                                return (
                                  <Chip
                                    key={opt.id}
                                    size="small"
                                    label={`${optionLabel(opt)}: ${valueLabel(val)}`}
                                    icon={
                                      val.hex_color ? (
                                        <Box
                                          sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            bgcolor: val.hex_color,
                                            border:
                                              "1px solid rgba(0,0,0,0.2)",
                                            ml: 0.5,
                                          }}
                                        />
                                      ) : undefined
                                    }
                                  />
                                );
                              })}
                            </Box>
                          </TableCell>
                          <TableCell>{v.sku || "—"}</TableCell>
                          <TableCell align="right">
                            {Number(v.price).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">{v.quantity}</TableCell>
                          <TableCell align="center">
                            {v.is_active ? "✓" : "—"}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t("common.edit")}>
                              <IconButton
                                size="small"
                                onClick={() => openEditVariant(v)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("common.delete")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteVariant(v)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </Stack>
      )}

      {/* Add/Edit Variant Dialog */}
      <Dialog
        open={vDialog.open}
        onClose={closeVariantDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {vDialog.editingId
            ? t("admin.editVariant")
            : t("admin.addVariant")}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("admin.pickOneValuePerOption")}
            </Typography>
            {allOptions.map((opt) => (
              <Box key={opt.id}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {optionLabel(opt)}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {opt.values.map((val) => {
                    const selected = vDialog.picks[opt.id] === val.id;
                    const blocked = wouldDuplicate(opt.id, val.id);
                    return (
                      <Tooltip
                        key={val.id}
                        title={
                          blocked ? t("admin.variantCombinationExists") : ""
                        }
                        disableHoverListener={!blocked}
                      >
                        <span>
                          <Chip
                            label={valueLabel(val)}
                            clickable={!blocked}
                            disabled={blocked}
                            color={selected ? "primary" : "default"}
                            variant={selected ? "filled" : "outlined"}
                            onClick={() =>
                              !blocked && togglePick(opt.id, val.id)
                            }
                            sx={{ opacity: blocked ? 0.45 : 1 }}
                            icon={
                              val.hex_color ? (
                                <Box
                                  sx={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    bgcolor: val.hex_color,
                                    border: "1px solid rgba(0,0,0,0.2)",
                                    ml: 0.5,
                                  }}
                                />
                              ) : undefined
                            }
                          />
                        </span>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Box>
            ))}
            <Divider />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("admin.sku")}
                  value={vDialog.sku}
                  onChange={(e) =>
                    setVDialog((s) => ({ ...s, sku: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.quantity")}
                  value={vDialog.quantity}
                  onChange={(e) =>
                    setVDialog((s) => ({ ...s, quantity: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.price")}
                  value={vDialog.price}
                  onChange={(e) =>
                    setVDialog((s) => ({ ...s, price: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {t("common.currency")}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={t("admin.comparePrice")}
                  value={vDialog.compare_price}
                  onChange={(e) =>
                    setVDialog((s) => ({
                      ...s,
                      compare_price: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={vDialog.is_active}
                    onChange={(_, v) =>
                      setVDialog((s) => ({ ...s, is_active: v }))
                    }
                  />
                }
                label={t("admin.active")}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={vDialog.is_default}
                    onChange={(_, v) =>
                      setVDialog((s) => ({ ...s, is_default: v }))
                    }
                  />
                }
                label={t("admin.isDefaultVariant")}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeVariantDialog} disabled={savingVariant}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={saveVariant}
            disabled={savingVariant}
            startIcon={<SaveIcon />}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack != null}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert
            severity={snack.sev}
            onClose={() => setSnack(null)}
            sx={{ borderRadius: 2 }}
          >
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
